# PulseBoard Frontend Monitoring System

A lightweight, plugin-based frontend monitoring project for React and Vue applications. The SDK captures runtime failures, Promise rejections, resource failures, Web Vitals, long tasks, slow resources, clicks, route changes, Fetch/XHR requests, and rrweb replay events.

All SDK modules communicate through one typed global `EventBus`. The Node.js service persists normalized telemetry in SQLite, exposes dashboard APIs, and restores Source Map positions with a built-in VLQ parser.

## Workspace

```text
packages/sdk          browser SDK
apps/server           Node.js and SQLite ingestion API
apps/dashboard        React monitoring dashboard
examples/react-demo   React integration demo
examples/vue-demo     Vue integration demo
```

## Local Startup

Node.js 24 or newer is required because the server uses `node:sqlite`.

```bash
corepack pnpm install
corepack pnpm dev
```

Open:

- Dashboard: `http://localhost:5173`
- React demo: `http://localhost:5174`
- Vue demo: `http://localhost:5175`
- API health: `http://localhost:3000/api/health`

The dashboard defaults to `react-demo`. Set `VITE_APP_ID=vue-demo` before starting the dashboard to inspect Vue telemetry.

## Docker Startup

```bash
docker compose up --build
```

SQLite data is persisted in the `monitor-data` volume.

## Five-Minute Demo

1. Open the React demo and interact with the replay-safe text field.
2. Trigger a runtime error, rejected Promise, failed request, and route change.
3. Click **Flush telemetry**.
4. Open PulseBoard to inspect overview counters, grouped errors, performance events, and replay sessions.
5. Open one session to play its rrweb recording.

## Source Map Upload

Upload a version 3 Source Map keyed by application, release, and generated file:

```bash
curl -X POST http://localhost:3000/api/sourcemaps \
  -H "content-type: application/json" \
  -d '{"appId":"react-demo","release":"1.0.0","generatedFile":"app.js","map":{"version":3,"file":"app.js","sources":["src/app.tsx"],"names":[],"mappings":"AAAA"}}'
```

Restore a generated frame:

```bash
curl -X POST http://localhost:3000/api/sourcemaps/restore \
  -H "content-type: application/json" \
  -d '{"appId":"react-demo","release":"1.0.0","generatedFile":"app.js","line":1,"column":0}'
```

## Verification

```bash
npm test
corepack pnpm typecheck
corepack pnpm build
docker compose config
```
