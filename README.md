# History of the testimony in South America

Interactive timeline web app. Each entry supports text, images, and video embeds.

## Quick Start
```bash
npm install
npm run dev
```

## Deploy to GitHub Pages via Actions
- Edit `vite.config.js` → `base: '/<repo-name>/'` (or `'/'` for user site).
- Commit & push to `main`.
- In GitHub: Settings → Pages → Source = GitHub Actions.

## Structure
- `src/App.jsx` — main app (edit `getInitialItems()`)
- `.github/workflows/deploy.yml` — CI deploy
