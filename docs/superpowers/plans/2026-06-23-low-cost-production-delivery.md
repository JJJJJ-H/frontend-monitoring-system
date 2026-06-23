# Low-Cost Production Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare PulseBoard for low-cost online delivery with a Render API, Vercel dashboard, Vercel React demo, and reproducible GitHub workflow.

**Architecture:** Keep the pnpm monorepo. Deploy `apps/server` as a Render Web Service with SQLite on a persistent disk, and deploy `apps/dashboard` plus `examples/react-demo` as Vercel static apps that call the Render API through `VITE_API_URL`.

**Tech Stack:** TypeScript, pnpm workspaces, Node 24 `node:sqlite`, React, Vue, Vite, Docker Compose, GitHub Actions, Render, Vercel.

---

## File Structure

```text
.github/workflows/ci.yml                     monorepo validation workflow
apps/server/src/config.ts                    environment parsing for release and allowed origins
apps/server/src/config.test.ts               config parsing tests
apps/server/src/app.ts                       health response uses release and db status
apps/server/src/app.test.ts                  health response regression coverage
apps/server/src/http.ts                      CORS and HTTP request handling helpers
apps/server/src/http.test.ts                 CORS allow/deny tests
apps/server/src/index.ts                     thin server startup wrapper
apps/server/Dockerfile                       production server image
apps/dashboard/src/api.ts                    already reads VITE_API_URL
examples/react-demo/src/monitor.ts           environment-based endpoint
examples/vue-demo/src/main.ts                environment-based endpoint
scripts/seed-demo-events.mjs                 local script that writes fixed demo events
docs/deployment/render-vercel-checklist.md   production deployment checklist
README.md                                    public-facing project guide
```

The main code boundary change is extracting HTTP/CORS behavior out of `index.ts`, making it testable without opening a port.

## Task 1: Add CI For The Monorepo

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: ["**"]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: corepack pnpm install --frozen-lockfile

      - name: Test
        run: corepack pnpm test

      - name: Typecheck
        run: corepack pnpm typecheck

      - name: Build
        run: corepack pnpm build

      - name: Validate Docker Compose
        run: docker compose config
```

- [ ] **Step 2: Run local validation**

Run:

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
docker compose config
```

Expected: all commands pass on Node 24 or later.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add monorepo validation workflow"
```

## Task 2: Add Production Config And Health Metadata

**Files:**
- Create: `apps/server/src/config.ts`
- Create: `apps/server/src/config.test.ts`
- Modify: `apps/server/src/app.ts`
- Modify: `apps/server/src/app.test.ts`

- [ ] **Step 1: Write config tests**

Create `apps/server/src/config.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAllowedOrigins, getServerConfig } from './config.ts'

test('parses allowed origins from comma-separated env', () => {
  assert.deepEqual(parseAllowedOrigins(' https://a.test,https://b.test ,, '), [
    'https://a.test',
    'https://b.test',
  ])
})

test('includes local origins by default for development', () => {
  const config = getServerConfig({})
  assert.equal(config.release, '0.1.0')
  assert.ok(config.allowedOrigins.includes('http://localhost:5173'))
  assert.ok(config.allowedOrigins.includes('http://localhost:5174'))
  assert.ok(config.allowedOrigins.includes('http://localhost:5175'))
})

test('uses production env values when provided', () => {
  const config = getServerConfig({
    MONITOR_ALLOWED_ORIGINS: 'https://dashboard.test,https://demo.test',
    MONITOR_RELEASE: '1.2.3',
  })

  assert.deepEqual(config.allowedOrigins, ['https://dashboard.test', 'https://demo.test'])
  assert.equal(config.release, '1.2.3')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
corepack pnpm --filter @monitor/server test
```

Expected: FAIL because `apps/server/src/config.ts` does not exist.

- [ ] **Step 3: Implement config**

Create `apps/server/src/config.ts`:

```ts
export interface ServerConfig {
  release: string
  allowedOrigins: string[]
}

const localOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']

export function parseAllowedOrigins(value: string | undefined): string[] {
  return value?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []
}

export function getServerConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const allowedOrigins = parseAllowedOrigins(env.MONITOR_ALLOWED_ORIGINS)
  return {
    release: env.MONITOR_RELEASE || '0.1.0',
    allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : localOrigins,
  }
}
```

- [ ] **Step 4: Update health response**

Change `createApp` in `apps/server/src/app.ts` to accept a config object and return richer health:

```ts
import type { ServerConfig } from './config.ts'

const defaultConfig: ServerConfig = {
  release: '0.1.0',
  allowedOrigins: [],
}

export function createApp(db: Database, config: ServerConfig = defaultConfig) {
  return {
    handle(request: AppRequest): AppResponse {
      try {
        const url = new URL(request.url, 'http://monitor.local')
        const appId = url.searchParams.get('appId') ?? ''

        if (request.method === 'GET' && url.pathname === '/api/health') {
          return {
            status: 200,
            body: {
              ok: true,
              service: 'pulseboard-api',
              release: config.release,
              database: 'ready',
            },
          }
        }
```

Keep the existing route logic after the health block unchanged.

- [ ] **Step 5: Update app test expectation**

In `apps/server/src/app.test.ts`, change the health assertion to:

```ts
assert.deepEqual(app.handle({ method: 'GET', url: '/api/health' }), {
  status: 200,
  body: {
    ok: true,
    service: 'pulseboard-api',
    release: '0.1.0',
    database: 'ready',
  },
})
```

- [ ] **Step 6: Run server tests**

Run:

```bash
corepack pnpm --filter @monitor/server test
```

Expected: all server tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/config.ts apps/server/src/config.test.ts apps/server/src/app.ts apps/server/src/app.test.ts
git commit -m "feat: add production server config"
```

## Task 3: Make CORS Testable And Production-Safe

**Files:**
- Create: `apps/server/src/http.ts`
- Create: `apps/server/src/http.test.ts`
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: Write CORS tests**

Create `apps/server/src/http.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { createCorsHeaders, isOriginAllowed } from './http.ts'

const allowedOrigins = ['https://dashboard.test', 'https://demo.test']

test('allows configured origins', () => {
  assert.equal(isOriginAllowed('https://dashboard.test', allowedOrigins), true)
})

test('denies unknown origins', () => {
  assert.equal(isOriginAllowed('https://unknown.test', allowedOrigins), false)
})

test('allows requests without origin for health checks and server-side tools', () => {
  assert.equal(isOriginAllowed(undefined, allowedOrigins), true)
})

test('creates cors headers for allowed browser origin', () => {
  assert.deepEqual(createCorsHeaders('https://demo.test', allowedOrigins), {
    'access-control-allow-origin': 'https://demo.test',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-monitor-internal',
    vary: 'Origin',
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
corepack pnpm --filter @monitor/server test
```

Expected: FAIL because `apps/server/src/http.ts` does not exist.

- [ ] **Step 3: Implement HTTP helpers**

Create `apps/server/src/http.ts`:

```ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApp } from './app.ts'
import type { Database } from './db.ts'
import type { ServerConfig } from './config.ts'

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  return !origin || allowedOrigins.includes(origin)
}

export function createCorsHeaders(origin: string | undefined, allowedOrigins: string[]): Record<string, string> {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? '*'
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-monitor-internal',
    vary: 'Origin',
  }
}

export function createRequestListener(db: Database, config: ServerConfig) {
  const app = createApp(db, config)
  return (request: IncomingMessage, response: ServerResponse) => {
    const origin = Array.isArray(request.headers.origin) ? request.headers.origin[0] : request.headers.origin
    const corsHeaders = createCorsHeaders(origin, config.allowedOrigins)

    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      response.writeHead(403, { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' })
      response.end(JSON.stringify({ error: 'Origin not allowed' }))
      return
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }

    const chunks: Buffer[] = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      try {
        const rawBody = Buffer.concat(chunks).toString('utf8')
        const result = app.handle({
          method: request.method ?? 'GET',
          url: request.url ?? '/',
          body: rawBody ? JSON.parse(rawBody) : undefined,
        })
        response.writeHead(result.status, {
          ...corsHeaders,
          'content-type': 'application/json; charset=utf-8',
        })
        response.end(JSON.stringify(result.body))
      } catch {
        response.writeHead(400, {
          ...corsHeaders,
          'content-type': 'application/json; charset=utf-8',
        })
        response.end(JSON.stringify({ error: 'Invalid request' }))
      }
    })
  }
}
```

Keep `createRequestListener` as the only place that knows about Node HTTP request objects.

- [ ] **Step 4: Make index.ts a thin startup wrapper**

Replace `apps/server/src/index.ts` with:

```ts
import { createServer } from 'node:http'
import { getServerConfig } from './config.ts'
import { createDatabase } from './db.ts'
import { createRequestListener } from './http.ts'

const config = getServerConfig()
const port = Number(process.env.PORT ?? 3000)

createServer(createRequestListener(createDatabase(), config)).listen(port, () => {
  console.log(`monitor server listening on http://localhost:${port}`)
})
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
corepack pnpm --filter @monitor/server test
corepack pnpm --filter @monitor/server typecheck
```

Expected: both commands pass. If `IncomingMessage.headers.origin` needs narrowing, keep it as `const origin = Array.isArray(request.headers.origin) ? request.headers.origin[0] : request.headers.origin`.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/http.ts apps/server/src/http.test.ts apps/server/src/index.ts
git commit -m "feat: enforce production cors"
```

## Task 4: Make Demo Endpoints Environment-Based

**Files:**
- Modify: `examples/react-demo/src/monitor.ts`
- Modify: `examples/vue-demo/src/main.ts`

- [ ] **Step 1: Update React demo endpoint**

Change the endpoint line in `examples/react-demo/src/monitor.ts` to:

```ts
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const endpoint = `${apiUrl.replace(/\/$/, '')}/api/events/batch`
```

Keep the rest of the monitor setup unchanged.

- [ ] **Step 2: Update Vue demo endpoint**

Change the endpoint line in `examples/vue-demo/src/main.ts` to:

```ts
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const endpoint = `${apiUrl.replace(/\/$/, '')}/api/events/batch`
```

Keep the rest of the monitor setup unchanged.

- [ ] **Step 3: Run demo typechecks**

Run:

```bash
corepack pnpm --filter @monitor/react-demo typecheck
corepack pnpm --filter @monitor/vue-demo typecheck
```

Expected: both commands pass.

- [ ] **Step 4: Commit**

```bash
git add examples/react-demo/src/monitor.ts examples/vue-demo/src/main.ts
git commit -m "feat: configure demo api endpoints"
```

## Task 5: Add Demo Data Seed Script

**Files:**
- Create: `scripts/seed-demo-events.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create seed script**

Create `scripts/seed-demo-events.mjs`:

```js
const apiUrl = process.argv[2]

if (!apiUrl) {
  console.error('Usage: node scripts/seed-demo-events.mjs https://your-api.onrender.com')
  process.exit(1)
}

const endpoint = `${apiUrl.replace(/\/$/, '')}/api/events/batch`
const now = Date.now()
const sessionId = `seed-${now}`

const base = {
  appId: 'react-demo',
  sessionId,
  pageUrl: 'https://pulseboard-demo.vercel.app',
  release: '1.0.0',
  environment: 'production',
}

const events = [
  {
    ...base,
    id: `${sessionId}-error`,
    type: 'error',
    timestamp: now - 4000,
    payload: { fingerprint: 'seed-runtime-error', message: 'Seeded runtime error' },
  },
  {
    ...base,
    id: `${sessionId}-lcp`,
    type: 'performance:lcp',
    timestamp: now - 3000,
    payload: { name: 'LCP', value: 1840, rating: 'good' },
  },
  {
    ...base,
    id: `${sessionId}-click`,
    type: 'behavior:click',
    timestamp: now - 2000,
    payload: { kind: 'click', tag: 'button', text: '立即上报数据' },
  },
  {
    ...base,
    id: `${sessionId}-fetch`,
    type: 'behavior:fetch',
    timestamp: now - 1000,
    payload: { kind: 'fetch', url: '/missing-api', method: 'GET', status: 404, duration: 120 },
  },
]

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ events }),
})

if (!response.ok) {
  console.error(`Seed failed: ${response.status}`)
  console.error(await response.text())
  process.exit(1)
}

console.log(await response.text())
```

- [ ] **Step 2: Add package script**

In root `package.json`, add:

```json
"seed:demo": "node scripts/seed-demo-events.mjs"
```

Keep JSON commas valid.

- [ ] **Step 3: Smoke-test argument validation**

Run:

```bash
node scripts/seed-demo-events.mjs
```

Expected: exits with usage text and non-zero status.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-demo-events.mjs package.json
git commit -m "feat: add demo event seed script"
```

## Task 6: Add Render And Vercel Deployment Checklist

**Files:**
- Create: `docs/deployment/render-vercel-checklist.md`

- [ ] **Step 1: Create deployment checklist**

Create `docs/deployment/render-vercel-checklist.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/deployment/render-vercel-checklist.md
git commit -m "docs: add render vercel deployment checklist"
```

## Task 7: Refresh Public README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add online links block**

Add near the top:

```markdown
## 在线演示

- API Health: `https://<render-service>.onrender.com/api/health`
- Dashboard: `https://<dashboard>.vercel.app`
- React Demo: `https://<react-demo>.vercel.app`
- Deployment Guide: [`docs/deployment/render-vercel-checklist.md`](docs/deployment/render-vercel-checklist.md)

部署完成前，将上述域名替换为实际 Render 和 Vercel Production 地址。
```

- [ ] **Step 2: Add architecture block**

Add before `## 工作区结构`:

```markdown
## 架构

```text
Browser Demo
  -> SDK Plugins
  -> Reporter Transports
  -> Render Node API
  -> SQLite Persistent Disk
  -> Dashboard Query APIs
  -> Vercel Dashboard
```

SDK 负责采集和上报，服务端负责规范化写入 SQLite、查询聚合和 Source Map 还原，看板负责可视化错误、性能、行为和录屏会话。
```

- [ ] **Step 3: Add deployment summary**

Add after Docker section:

```markdown
## 低成本线上部署

- `apps/server`：Render Web Service，使用 Docker 和 persistent disk。
- `apps/dashboard`：Vercel 静态站点，`VITE_API_URL` 指向 Render API。
- `examples/react-demo`：Vercel 静态站点，`VITE_API_URL` 指向 Render API。
- `examples/vue-demo`：默认作为本地示例，免费额度允许时可再部署到 Vercel。

完整步骤见 [`docs/deployment/render-vercel-checklist.md`](docs/deployment/render-vercel-checklist.md)。
```

- [ ] **Step 4: Run docs-adjacent verification**

Run:

```bash
corepack pnpm typecheck
corepack pnpm build
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: refresh public project readme"
```

## Task 8: Final Local Verification

**Files:**
- Review: `package.json`
- Review: `docker-compose.yml`
- Review: `apps/server/Dockerfile`

- [ ] **Step 1: Run full validation**

Run:

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
docker compose config
```

Expected: all commands pass.

- [ ] **Step 2: Run Docker server smoke check if Docker is available**

Run:

```bash
docker compose up --build server
```

In another terminal:

```bash
curl http://localhost:3000/api/health
```

Expected: health response contains `ok: true`. Stop the compose service afterward.

- [ ] **Step 3: Inspect final git state**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: no accidental runtime logs, database files, or secrets are tracked.

- [ ] **Step 4: Record deployment handoff**

After actual platform setup, record:

```text
GitHub repository:
Render API URL:
Vercel dashboard URL:
Vercel React demo URL:
CI status:
```

Do not commit fake production URLs as final claims.

## Self-Review

- Spec coverage: CI, Render API, Vercel dashboard/demo, CORS, env-based endpoints, demo data, README, and deployment checklist are covered.
- Placeholder scan: URL placeholders are explicitly deployment-time values and should be replaced after real platform setup.
- Type consistency: `ServerConfig`, `createApp(db, config)`, and `createRequestListener(db, config)` are introduced before later tasks depend on them.
