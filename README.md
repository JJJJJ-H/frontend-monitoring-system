# PulseBoard 前端监控系统

这是一个面向 React 和 Vue 应用的轻量级、插件化前端监控项目。SDK 可以采集运行时错误、Promise 拒绝、资源加载失败、Web Vitals、长任务、资源耗时、点击行为、路由变化、Fetch/XHR 请求和 rrweb 录屏事件。

所有 SDK 模块都通过一个带类型的全局 `EventBus` 解耦通信。Node.js 服务端负责把标准化监控数据持久化到 SQLite，提供看板查询 API，并通过内置 VLQ 解析器还原 Source Map 源码位置。

## 在线演示

- API Health: `https://<render-service>.onrender.com/api/health`
- Dashboard: `https://<dashboard>.vercel.app`
- React Demo: `https://<react-demo>.vercel.app`
- Deployment Guide: [`docs/deployment/render-vercel-checklist.md`](docs/deployment/render-vercel-checklist.md)

部署完成前，将上述域名替换为实际 Render 和 Vercel Production 地址。

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

## 工作区结构

```text
packages/sdk          浏览器监控 SDK
apps/server           Node.js + SQLite 数据接收服务
apps/dashboard        React 监控看板
examples/react-demo   React 接入示例
examples/vue-demo     Vue 接入示例
```

## 本地启动

服务端使用 `node:sqlite`，因此需要 Node.js 24 或更高版本。

```bash
corepack pnpm install
corepack pnpm dev
```

访问地址：

- 监控看板：`http://localhost:5173`
- React 示例：`http://localhost:5174`
- Vue 示例：`http://localhost:5175`
- API 健康检查：`http://localhost:3000/api/health`

看板默认查看 `react-demo` 的数据。如果想查看 Vue 示例数据，请在启动看板前设置 `VITE_APP_ID=vue-demo`。

## Docker 启动

```bash
docker compose up --build
```

SQLite 数据会持久化到 `monitor-data` volume。

## 低成本线上部署

- `apps/server`：Render Web Service，使用 Docker 和 persistent disk。
- `apps/dashboard`：Vercel 静态站点，`VITE_API_URL` 指向 Render API。
- `examples/react-demo`：Vercel 静态站点，`VITE_API_URL` 指向 Render API。
- `examples/vue-demo`：默认作为本地示例，免费额度允许时可再部署到 Vercel。

完整步骤见 [`docs/deployment/render-vercel-checklist.md`](docs/deployment/render-vercel-checklist.md)。

## 五分钟演示流程

1. 打开 React 示例，先在录屏脱敏输入框里输入一些内容。
2. 依次触发运行时错误、Promise 拒绝、失败请求和路由变化。
3. 点击 **立即上报数据**。
4. 打开监控看板，查看总览、错误聚合、性能事件和录屏会话。
5. 进入某个会话，播放 rrweb 录屏回放。

## Source Map 上传

按应用、版本和构建产物文件上传 version 3 Source Map：

```bash
curl -X POST http://localhost:3000/api/sourcemaps \
  -H "content-type: application/json" \
  -d '{"appId":"react-demo","release":"1.0.0","generatedFile":"app.js","map":{"version":3,"file":"app.js","sources":["src/app.tsx"],"names":[],"mappings":"AAAA"}}'
```

还原构建产物中的某个堆栈位置：

```bash
curl -X POST http://localhost:3000/api/sourcemaps/restore \
  -H "content-type: application/json" \
  -d '{"appId":"react-demo","release":"1.0.0","generatedFile":"app.js","line":1,"column":0}'
```

## 验证命令

```bash
npm test
corepack pnpm typecheck
corepack pnpm build
docker compose config
```
