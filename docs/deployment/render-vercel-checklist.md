# Render + Vercel Production Checklist

## 1. GitHub

- Push the repository to GitHub.
- Confirm the `CI` workflow passes.

## 2. Render API

- Create a Render Web Service from the GitHub repository.
- Runtime: Docker.
- Dockerfile path: `apps/server/Dockerfile`.
- Add a persistent disk mounted at `/data`.
- Set environment variables:

| Name | Value |
| --- | --- |
| `MONITOR_DB_PATH` | `/data/monitor.db` |
| `MONITOR_RELEASE` | `0.1.0` |
| `MONITOR_ALLOWED_ORIGINS` | Vercel dashboard and demo origins, comma-separated |

After deploy:

```bash
curl https://<render-service>.onrender.com/api/health
```

Expected: `ok` is `true`, `service` is `pulseboard-api`, and `database` is `ready`.

## 3. Vercel Dashboard

- Import the same GitHub repository.
- Root directory: `apps/dashboard`.
- Build command: `corepack pnpm --filter @monitor/dashboard build`.
- Output directory: `dist`.
- Environment variables:
  - `VITE_API_URL=https://<render-service>.onrender.com`
  - `VITE_APP_ID=react-demo`

## 4. Vercel React Demo

- Create another Vercel project from the same repository.
- Root directory: `examples/react-demo`.
- Build command: `corepack pnpm --filter @monitor/react-demo build`.
- Output directory: `dist`.
- Environment variables:
  - `VITE_API_URL=https://<render-service>.onrender.com`

## 5. CORS

After both Vercel projects have production domains, update Render:

```text
MONITOR_ALLOWED_ORIGINS=https://<dashboard>.vercel.app,https://<react-demo>.vercel.app
```

Redeploy the Render service.

## 6. Demo Data

Generate one batch of demo data:

```bash
corepack pnpm seed:demo https://<render-service>.onrender.com
```

## 7. Acceptance

- Open the dashboard and confirm overview counts are non-zero.
- Open the React demo, trigger an error, trigger a failed request, and click `立即上报数据`.
- Refresh the dashboard and confirm data changed.
- Open `/api/health` and confirm the API is healthy.
