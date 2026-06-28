# Chrysanthos Rouvellas — Portfolio

Static portfolio for [GitHub Pages](https://pages.github.com/) and [rouvellas.com](https://rouvellas.com/). HTML, CSS, and vanilla JavaScript.

## Live site

| URL |
|-----|
| `https://rouvellas.com/` |
| `https://hoolies.github.io/` |

## Local preview

```bash
cd portfolio
python3 -m http.server 8080
# Open http://localhost:8080
```

## Structure

```
portfolio/
├── index.html
├── css/styles.css
├── js/main.js
├── fonts/                    # Self-hosted Syne, IBM Plex Mono, Hack Nerd Font Mono
├── chrysanthos/skills/       # Skill directories + manifest (source of truth)
├── scripts/
│   ├── sync-skills-dirs.py   # Create dirs from manifest
│   └── build-skills-tree.py  # Regenerate tree HTML in index.html
├── FUTURE.md                 # Reminders (GitHub repos, Highlights links)
├── og-image.html             # Source for social preview image
└── CNAME                     # rouvellas.com
```

## Skills tree

Categories and order live in `chrysanthos/skills/skills.manifest.json`. Matching directories under `chrysanthos/skills/` back the `tree -d -C -L 2 chrysanthos/skills` display.

After editing the manifest:

```bash
python3 scripts/sync-skills-dirs.py
python3 scripts/build-skills-tree.py
```

## Social preview image (`og-image.png`)

Meta tags in `index.html` point to `https://rouvellas.com/og-image.png`. That file is what LinkedIn, Slack, iMessage, and X show when someone pastes your URL.

**Why it matters:** Without it, shares show a blank card or a generic GitHub icon — you lose the first impression before anyone visits the site.

**Generate once (or after branding changes):**

```bash
chromium --headless --disable-gpu --screenshot=og-image.png --window-size=1200,630 \
  --default-background-color=06080c file://$PWD/og-image.html
```

Commit `og-image.png` to the repo root.

## Custom domain

`CNAME` contains `rouvellas.com`. DNS should point to GitHub Pages; enable **Enforce HTTPS** in repo Settings → Pages.

## Analytics (GoatCounter)

1. Sign up at [goatcounter.com](https://www.goatcounter.com) — site code **`hoolies`**
2. Add `rouvellas.com` and `hoolies.github.io` in GoatCounter settings
3. Stats: `https://hoolies.goatcounter.com`

## Deploy

```bash
./deploy.sh
```

Or push to `main` on `hoolies/hoolies.github.io` with GitHub Pages enabled.

## Customize

- **Copy & sections:** `index.html`
- **Colors:** CSS variables at top of `css/styles.css`
- **Terminal commands:** `js/main.js` → `initTerminal()`
- **Keyboard shortcuts:** press `?` on the site
