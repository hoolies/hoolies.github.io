#!/usr/bin/env bash
# Deploy portfolio to GitHub Pages (creates repo, pushes, enables Pages).
# Usage:
#   ./deploy.sh              # uses SSH (after key is added to GitHub)
#   GH_TOKEN=ghp_xxx ./deploy.sh   # uses HTTPS + API

set -euo pipefail

REPO="hoolies.github.io"
OWNER="hoolies"
BRANCH="main"
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

api() {
  curl -fsSL -H "Authorization: Bearer ${GH_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$@"
}

ensure_repo_ssh() {
  if ssh -T git@github.com -o BatchMode=yes 2>&1 | grep -q "successfully authenticated"; then
    return 0
  fi
  echo "SSH auth failed. Add ~/.ssh/github_rsa.pub to GitHub → Settings → SSH keys."
  echo "Or run: GH_TOKEN=your_token ./deploy.sh"
  return 1
}

ensure_repo_token() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    "https://api.github.com/repos/${OWNER}/${REPO}")

  if [[ "$code" == "200" ]]; then
    echo "Repository already exists."
    return 0
  fi

  echo "Creating repository ${OWNER}/${REPO}..."
  api -X POST "https://api.github.com/user/repos" \
    -d "{\"name\":\"${REPO}\",\"public\":true,\"description\":\"Portfolio site\"}"
  echo
}

enable_pages_token() {
  echo "Enabling GitHub Pages on ${BRANCH}..."
  api -X POST "https://api.github.com/repos/${OWNER}/${REPO}/pages" \
    -d "{\"build_type\":\"legacy\",\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}" \
    2>/dev/null || api -X PUT "https://api.github.com/repos/${OWNER}/${REPO}/pages" \
    -d "{\"build_type\":\"legacy\",\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}"
  echo
}

push_ssh() {
  git remote set-url origin "git@github.com:${OWNER}/${REPO}.git"
  git push -u origin "${BRANCH}"
}

push_https() {
  git remote set-url origin "https://${OWNER}@github.com/${OWNER}/${REPO}.git"
  GIT_ASKPASS=/bin/echo GIT_TERMINAL_PROMPT=0 \
    git -c "credential.helper=" \
    push "https://x-access-token:${GH_TOKEN}@github.com/${OWNER}/${REPO}.git" "${BRANCH}"
  git remote set-url origin "git@github.com:${OWNER}/${REPO}.git"
}

echo "=== Portfolio deploy ==="

if [[ -n "${GH_TOKEN:-}" ]]; then
  ensure_repo_token
  push_https
  enable_pages_token
  echo "Done. Site: https://${OWNER}.github.io/"
elif ensure_repo_ssh; then
  if ! curl -fsSL "https://github.com/${OWNER}/${REPO}" >/dev/null 2>&1; then
    echo "Repository ${OWNER}/${REPO} does not exist yet."
    echo "Create it at: https://github.com/new?name=${REPO}"
    echo "(Public, no README — then re-run ./deploy.sh)"
    exit 1
  fi
  push_ssh
  echo "Done. Enable Pages: repo Settings → Pages → branch ${BRANCH} / root"
  echo "Site: https://${OWNER}.github.io/"
else
  exit 1
fi
