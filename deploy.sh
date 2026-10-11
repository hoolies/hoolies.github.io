#!/usr/bin/env bash
# Deploy the portfolio to GitHub Pages (creates the repo, pushes, enables Pages).

set -euo pipefail

unalias -a
unset -f curl git ssh chmod rm mktemp

export LC_ALL=C

readonly PROGNAME="${0##*/}"
readonly REPO="hoolies.github.io"
readonly OWNER="hoolies"
readonly BRANCH="main"
ROOT="$(cd -- "$(dirname -- "$0")" && pwd)"
readonly ROOT

askpass_file=

cleanup() {
    if [ -n "$askpass_file" ]; then
        rm -f -- "$askpass_file"
        askpass_file=
    fi
}

trap cleanup EXIT

usage() {
    printf 'Usage: %s [OPTION]...\n' "$PROGNAME"
    printf 'Deploy the portfolio to GitHub Pages.\n'
    printf '\n'
    printf 'Mandatory arguments to long options are mandatory for short options too.\n'
    printf '\n'
    printf '  -h, --help            display this help and exit\n'
}

log() {
    printf '%s\n' "$1" >&2
}

strip_quotes() {
    local value="$1"
    value=${value%\"}
    value=${value#\"}
    value=${value%\'}
    value=${value#\'}
    printf '%s' "$value"
}

load_token() {
    local line key value

    if [ -z "${GH_TOKEN:-}" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
        GH_TOKEN=$GITHUB_TOKEN
    fi
    if [ -n "${GH_TOKEN:-}" ] || [ ! -f "$ROOT/.env" ]; then
        return 0
    fi

    while IFS= read -r line || [ -n "$line" ]; do
        line=${line%$'\r'}
        case "$line" in
            "" | \#*)
                continue
                ;;
            "export GH_TOKEN="* | "GH_TOKEN="*)
                key=GH_TOKEN
                ;;
            "export GITHUB_TOKEN="* | "GITHUB_TOKEN="*)
                key=GITHUB_TOKEN
                ;;
            *)
                continue
                ;;
        esac
        value=${line#*"${key}"=}
        value=$(strip_quotes "$value")
        if [ "$key" = "GH_TOKEN" ] || [ -z "${GH_TOKEN:-}" ]; then
            GH_TOKEN=$value
        fi
    done <"$ROOT/.env"
    return 0
}

api() {
    curl -fsSL \
        -H "Authorization: Bearer ${GH_TOKEN}" \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "$@"
}

ssh_authenticated() {
    local output
    output=$(ssh -T git@github.com -o BatchMode=yes 2>&1 || true)
    case "$output" in
        *"successfully authenticated"*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

ensure_repo_token() {
    local code payload
    code=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer ${GH_TOKEN}" \
        "https://api.github.com/repos/${OWNER}/${REPO}")

    if [ "$code" = "200" ]; then
        log "Repository already exists."
        return 0
    fi

    log "Creating repository ${OWNER}/${REPO}..."
    payload=$(printf '{"name":"%s","public":true,"description":"Portfolio site"}' "$REPO")
    api -X POST "https://api.github.com/user/repos" -d "$payload"
    printf '\n' >&2
}

enable_pages_token() {
    local payload
    log "Enabling GitHub Pages on ${BRANCH}..."
    payload=$(printf '{"build_type":"legacy","source":{"branch":"%s","path":"/"}}' "$BRANCH")
    api -X POST "https://api.github.com/repos/${OWNER}/${REPO}/pages" -d "$payload" \
        >/dev/null 2>&1 ||
        api -X PUT "https://api.github.com/repos/${OWNER}/${REPO}/pages" -d "$payload" \
            >/dev/null
    printf '\n' >&2
}

write_askpass() {
    askpass_file=$(mktemp)
    cat >"$askpass_file" <<'EOF'
#!/bin/sh
printf '%s\n' "${GH_TOKEN}"
EOF
    chmod 700 -- "$askpass_file"
}

push_https() {
    write_askpass
    GIT_ASKPASS=$askpass_file GIT_TERMINAL_PROMPT=0 \
        git -c credential.helper= \
        push "https://x-access-token@github.com/${OWNER}/${REPO}.git" "$BRANCH"
}

push_ssh() {
    local previous
    previous=$(git remote get-url origin)
    git remote set-url origin "git@github.com:${OWNER}/${REPO}.git"
    if git push -u origin "${BRANCH}"; then
        return 0
    fi
    git remote set-url origin "$previous"
    return 1
}

github_repo_visible() {
    curl -fsSL "https://github.com/${OWNER}/${REPO}" >/dev/null 2>&1
}

deploy() {
    log "=== Portfolio deploy ==="

    if [ -n "${GH_TOKEN:-}" ]; then
        ensure_repo_token
        push_https
        enable_pages_token
        log "Done. Site: https://${OWNER}.github.io/"
        return 0
    fi

    if ssh_authenticated; then
        if ! github_repo_visible; then
            log "Repository ${OWNER}/${REPO} does not exist yet."
            log "Create it at: https://github.com/new?name=${REPO}"
            log "(Public, no README — then re-run ${PROGNAME})"
            return 1
        fi
        push_ssh
        log "Done. Enable Pages: repo Settings → Pages → branch ${BRANCH} / root"
        log "Site: https://${OWNER}.github.io/"
        return 0
    fi

    log "SSH auth failed. Add an SSH key to GitHub → Settings → SSH keys."
    log "Or run: GH_TOKEN=your_token ./${PROGNAME}"
    return 1
}

main() {
    local arg

    cd -- "$ROOT"
    load_token
    if [ -n "${GH_TOKEN:-}" ]; then
        export GH_TOKEN
    fi

    if [ "$#" -gt 1 ]; then
        printf '%s: unrecognized option %s\n' "$PROGNAME" "$2" >&2
        printf "Try '%s --help' for more information.\n" "$PROGNAME" >&2
        return 2
    fi

    if [ "$#" -eq 1 ]; then
        arg=$1
        case "$arg" in
            -h | --help)
                usage
                return 0
                ;;
            *)
                printf '%s: unrecognized option %s\n' "$PROGNAME" "$arg" >&2
                printf "Try '%s --help' for more information.\n" "$PROGNAME" >&2
                return 2
                ;;
        esac
    fi

    deploy
}

main "$@"
