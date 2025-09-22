# Manager App

Static site deployment notes:

- Start command: `yarn start`
- Node server (`server.js`) serves static files and REST API, connects Postgres via `DATABASE_URL`.
- Root is the repository root (contains `index.html`).

Local run:

```bash
export DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
yarn install --frozen-lockfile || yarn install
yarn dev
```

Render (Web Service) settings:
- Build command: `yarn install`
- Start command: `yarn start`
- Env var: `DATABASE_URL` (Render Postgres provided)