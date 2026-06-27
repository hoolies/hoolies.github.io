# Chrysanthos Rouvellas — Portfolio

A modern, static portfolio site designed for [GitHub Pages](https://pages.github.com/). No build step, no frameworks — just HTML, CSS, and vanilla JavaScript.

## Live site

After deployment, your site will be available at one of:

| Repository name | URL |
|-----------------|-----|
| `hoolies.github.io` | `https://hoolies.github.io/` |
| `portfolio` (or any name) | `https://hoolies.github.io/portfolio/` |

## Deploy to GitHub Pages

### Option A — User site (recommended)

Serves at `https://hoolies.github.io/` (root domain).

```bash
cd portfolio
git init
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin git@github.com:hoolies/hoolies.github.io.git
git push -u origin main
```

Then in GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `/ (root)`**.

### Option B — Project site

Serves at `https://hoolies.github.io/portfolio/`.

```bash
cd portfolio
git init
git add .
git commit -m "Initial portfolio site"
git branch -M main
git remote add origin git@github.com:hoolies/portfolio.git
git push -u origin main
```

Enable Pages the same way. If you use a project repo, update the `og:url` in `index.html` to match your final URL.

## Custom domain (optional)

GitHub Pages supports one custom domain per site for free (e.g. `rouvellas.com`):

1. Add a `CNAME` file containing your domain:
   ```
   rouvellas.com
   ```
2. Configure DNS at your registrar (A records to GitHub Pages IPs, or CNAME to `hoolies.github.io`).
3. Enable **Enforce HTTPS** in repo Settings → Pages.

## Local preview

Any static file server works:

```bash
cd portfolio
python3 -m http.server 8080
# Open http://localhost:8080
```

## Structure

```
portfolio/
├── index.html      # Single-page site
├── css/styles.css  # All styles
├── js/main.js      # Canvas, terminal, animations
├── favicon.svg
├── .nojekyll       # Skip Jekyll processing on GitHub Pages
└── README.md
```

## Customize

- **Content**: Edit sections directly in `index.html`.
- **Colors**: CSS variables at the top of `css/styles.css` (`--accent`, `--bg-base`, etc.).
- **Terminal commands**: Array in `js/main.js` → `initTerminal()`.
