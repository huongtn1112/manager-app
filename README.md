# Manager App

Static site deployment notes:

- Start command: `yarn start`
- Uses `serve` to host the static files on `$PORT` (Render-compatible).
- Root is the repository root (contains `index.html`).

Local run:

```bash
yarn install --frozen-lockfile || yarn install
yarn start
```