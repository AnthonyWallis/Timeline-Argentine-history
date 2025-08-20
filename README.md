# Right-Side Dynamic Timeline (1850–Today)

Interactive timeline web app with a right-docked rail and three views (Date · Place · Event). Each entry supports text, images, and video embeds.

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
