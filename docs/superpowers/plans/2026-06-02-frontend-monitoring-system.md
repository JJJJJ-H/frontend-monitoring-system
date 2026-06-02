# Frontend Monitoring System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable TypeScript monorepo that captures browser errors, performance data, behavior, and rrweb recordings; persists telemetry in SQLite; restores Source Map stack positions; and presents the results in a React dashboard.

**Architecture:** A typed global EventBus is the only communication channel between SDK modules. Browser plugins emit normalized telemetry envelopes, a reporter plugin batches and transports them, and a Node service stores and queries SQLite data for a React dashboard. React and Vue demos exercise the full workflow locally and through Docker Compose.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, Vite, React, Vue, rrweb, rrweb-player, web-vitals, Fastify, better-sqlite3, source-map, Recharts, Docker Compose

---

## File Map

```text
package.json                          Workspace scripts
pnpm-workspace.yaml                   Workspace package discovery
tsconfig.base.json                    Shared TypeScript options
vitest.workspace.ts                   Cross-package test discovery
packages/sdk/src/core/*               EventBus, monitor lifecycle, common event types
packages/sdk/src/plugins/*            Error, performance, behavior, replay, reporter plugins
packages/sdk/src/transports/*         Fetch, Beacon, and Image delivery adapters
apps/server/src/*                     Fastify API, SQLite schema, services, routes
apps/dashboard/src/*                  React dashboard pages and API client
examples/react-demo/src/*             React SDK integration demo
examples/vue-demo/src/*               Vue SDK integration demo
docker-compose.yml                    Containerized local demo
README.md                             Setup and demonstration guide
```

## Task 1: Workspace Skeleton

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`
- Create: `.gitignore`
- Create: package manifests and `tsconfig.json` files under `packages/sdk`, `apps/server`, `apps/dashboard`, `examples/react-demo`, and `examples/vue-demo`

- [ ] Add workspace scripts for `dev`, `build`, `test`, and `typecheck`, with recursive package execution.
- [ ] Add package manifests with explicit dependencies and development scripts.
- [ ] Run `corepack pnpm install`.
- [ ] Run `corepack pnpm test` and confirm the empty workspace command exits successfully.
- [ ] Commit with `chore: initialize monitoring workspace`.

## Task 2: Typed Global EventBus

**Files:**
- Create: `packages/sdk/src/core/event-bus.ts`
- Create: `packages/sdk/src/core/types.ts`
- Test: `packages/sdk/src/core/event-bus.test.ts`

- [ ] Write failing tests proving `on`, unsubscribe, and subscriber exception isolation.
- [ ] Run `corepack pnpm --filter @monitor/sdk test -- event-bus.test.ts` and confirm failure because `EventBus` is missing.
- [ ] Implement a generic `EventBus<TEvents>` whose `emit` catches subscriber errors and continues dispatch.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat(sdk): add typed event bus`.

## Task 3: SDK Lifecycle and Normalized Envelopes

**Files:**
- Create: `packages/sdk/src/core/monitor.ts`
- Create: `packages/sdk/src/core/plugin.ts`
- Create: `packages/sdk/src/core/session.ts`
- Create: `packages/sdk/src/index.ts`
- Test: `packages/sdk/src/core/monitor.test.ts`

- [ ] Write failing tests proving plugins start and stop through lifecycle bus events, duplicate starts are ignored, and captured payloads receive envelope metadata.
- [ ] Run focused tests and confirm the missing monitor failure.
- [ ] Implement `createMonitor`, `start`, `stop`, `flush`, session creation, and event envelope generation.
- [ ] Run focused tests and confirm they pass.
- [ ] Commit with `feat(sdk): add monitor lifecycle`.

## Task 4: Error, Performance, and Behavior Capture

**Files:**
- Create: `packages/sdk/src/plugins/error-plugin.ts`
- Create: `packages/sdk/src/plugins/performance-plugin.ts`
- Create: `packages/sdk/src/plugins/behavior-plugin.ts`
- Create: `packages/sdk/src/core/privacy.ts`
- Test: `packages/sdk/src/plugins/error-plugin.test.ts`
- Test: `packages/sdk/src/plugins/behavior-plugin.test.ts`

- [ ] Write failing tests for runtime error fingerprints, duplicate suppression, resource error capture, request marker exclusion, and input/URL sanitization.
- [ ] Run focused tests and confirm failures for missing plugins.
- [ ] Implement browser listener registration and EventBus-only telemetry emission.
- [ ] Add Web Vitals, `PerformanceObserver` long task, and resource timing capture with guarded browser feature detection.
- [ ] Run SDK tests and confirm they pass.
- [ ] Commit with `feat(sdk): add browser telemetry plugins`.

## Task 5: rrweb Replay and Reporter Transports

**Files:**
- Create: `packages/sdk/src/plugins/replay-plugin.ts`
- Create: `packages/sdk/src/plugins/reporter-plugin.ts`
- Create: `packages/sdk/src/transports/fetch-transport.ts`
- Create: `packages/sdk/src/transports/beacon-transport.ts`
- Create: `packages/sdk/src/transports/image-transport.ts`
- Test: `packages/sdk/src/plugins/reporter-plugin.test.ts`

- [ ] Write failing tests for threshold flushing, bounded retries, unload Beacon preference, Image fallback, and internal request marking.
- [ ] Run focused tests and confirm failures for the missing reporter.
- [ ] Implement queueing and transport selection through EventBus events only.
- [ ] Implement rrweb recording with masked inputs, blocked password fields, ignored sensitive nodes, and replay batch events.
- [ ] Run SDK tests and confirm they pass.
- [ ] Commit with `feat(sdk): add replay and resilient reporting`.

## Task 6: SQLite Server and Ingestion API

**Files:**
- Create: `apps/server/src/app.ts`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/db.ts`
- Create: `apps/server/src/schema.ts`
- Create: `apps/server/src/routes/events.ts`
- Test: `apps/server/src/routes/events.test.ts`

- [ ] Write failing integration tests for valid transactional batch ingestion and invalid payload rejection.
- [ ] Run `corepack pnpm --filter @monitor/server test -- events.test.ts` and confirm failure because the app is missing.
- [ ] Implement Fastify app creation, SQLite migration, event validation, and transactional inserts.
- [ ] Run focused tests and confirm they pass.
- [ ] Commit with `feat(server): persist telemetry batches`.

## Task 7: Query APIs and Source Map Restoration

**Files:**
- Create: `apps/server/src/routes/overview.ts`
- Create: `apps/server/src/routes/errors.ts`
- Create: `apps/server/src/routes/performance.ts`
- Create: `apps/server/src/routes/sessions.ts`
- Create: `apps/server/src/routes/sourcemaps.ts`
- Create: `apps/server/src/services/source-map-service.ts`
- Test: `apps/server/src/routes/query.test.ts`
- Test: `apps/server/src/services/source-map-service.test.ts`

- [ ] Write failing tests for overview aggregation, grouped errors, performance trends, replay retrieval, Source Map upload, restored frames, and raw-stack fallback.
- [ ] Run server tests and confirm expected failures.
- [ ] Implement indexed query routes and file-backed Source Map storage keyed by `appId`, `release`, and generated file.
- [ ] Run server tests and confirm they pass.
- [ ] Commit with `feat(server): add monitoring queries and source maps`.

## Task 8: React Dashboard

**Files:**
- Create: `apps/dashboard/src/main.tsx`
- Create: `apps/dashboard/src/app.tsx`
- Create: `apps/dashboard/src/api.ts`
- Create: `apps/dashboard/src/styles.css`
- Create: `apps/dashboard/src/pages/overview-page.tsx`
- Create: `apps/dashboard/src/pages/errors-page.tsx`
- Create: `apps/dashboard/src/pages/performance-page.tsx`
- Create: `apps/dashboard/src/pages/sessions-page.tsx`
- Create: `apps/dashboard/src/pages/replay-page.tsx`
- Test: `apps/dashboard/src/app.test.tsx`

- [ ] Write failing tests for navigation and empty-state rendering.
- [ ] Run dashboard tests and confirm failure because the app is missing.
- [ ] Implement dashboard layout, server API client, summary cards, tables, Recharts trend views, and rrweb-player replay.
- [ ] Run dashboard tests and confirm they pass.
- [ ] Commit with `feat(dashboard): add monitoring views`.

## Task 9: React and Vue Demo Applications

**Files:**
- Create: `examples/react-demo/src/main.tsx`
- Create: `examples/react-demo/src/app.tsx`
- Create: `examples/vue-demo/src/main.ts`
- Create: `examples/vue-demo/src/App.vue`

- [ ] Add SDK setup with app IDs, release names, all capture plugins, and reporter plugin.
- [ ] Add buttons for runtime errors, rejected promises, failed requests, route changes, and replay-friendly input interaction.
- [ ] Run workspace typecheck and fix integration errors.
- [ ] Commit with `feat(examples): add react and vue monitoring demos`.

## Task 10: Docker Compose and Documentation

**Files:**
- Create: `apps/server/Dockerfile`
- Create: `apps/dashboard/Dockerfile`
- Create: `examples/react-demo/Dockerfile`
- Create: `examples/vue-demo/Dockerfile`
- Create: `docker-compose.yml`
- Create: `README.md`

- [ ] Add production container builds and persistent volumes for SQLite and Source Maps.
- [ ] Document `corepack pnpm install`, `corepack pnpm dev`, Docker Compose startup, ports, Source Map upload, and a five-minute demo flow.
- [ ] Run `docker compose config` and confirm configuration validity when Docker is installed.
- [ ] Commit with `docs: add local and docker demo workflow`.

## Task 11: Workspace Verification

**Files:**
- Modify only files required to correct verification failures.

- [ ] Run `corepack pnpm test`.
- [ ] Run `corepack pnpm typecheck`.
- [ ] Run `corepack pnpm build`.
- [ ] Start the local stack and verify the server health endpoint.
- [ ] Exercise ingestion, overview, error details, performance, sessions, and replay APIs with a scripted smoke flow.
- [ ] Commit any fixes with `fix: resolve workspace verification issues`.

## Task 12: Final Review

- [ ] Compare implemented behavior against `docs/superpowers/specs/2026-06-02-frontend-monitoring-system-design.md`.
- [ ] Review git diff and status for accidental files or secrets.
- [ ] Re-run `corepack pnpm test`, `corepack pnpm typecheck`, and `corepack pnpm build`.
- [ ] Record Docker availability and any verification limits in the final report.

