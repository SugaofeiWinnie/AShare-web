# AShare Web

Vue 3 + TypeScript + Vite frontend for the A-share market dashboard.

## Requirements

- Node.js 22 LTS
- npm 10+

## Run

```bash
npm install
npm run dev
```

The dev server listens on `http://localhost:5173` and proxies `/api` to `http://127.0.0.1:8080`.

For a deployed backend on another host, set:

```bash
VITE_API_BASE_URL=http://your-api-host:8080 npm run build
```
