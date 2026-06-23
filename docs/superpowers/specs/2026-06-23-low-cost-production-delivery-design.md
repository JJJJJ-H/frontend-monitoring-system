# PulseBoard 前端监控系统低成本上线交付设计

## 1. 目标

将 PulseBoard 前端监控系统整理成一个可公开访问、可从 GitHub 复现、可在线演示完整链路的轻量企业级项目。低成本上线策略为：GitHub 托管代码，Render 部署 Node + SQLite API，Vercel 部署 dashboard 和演示应用。

交付完成后，项目应具备：

- 公开 GitHub 仓库，README 能解释 SDK、服务端、看板、示例应用和部署方式。
- 一个线上监控 API 地址，提供健康检查、数据上报、数据查询和 Source Map 还原接口。
- 一个线上 dashboard 地址，能看到真实或种子监控数据。
- 一个线上 React demo 应用地址，用户操作后能向线上 API 上报数据；Vue demo 保持可本地运行，若免费额度允许再部署到 Vercel。
- GitHub Actions 在推送和 Pull Request 时运行测试、类型检查、构建和 Docker 配置校验。
- 生产配置支持环境变量，不把本地 `localhost` 固化到线上构建。

## 2. 当前基础

项目已经具备完整雏形：

- pnpm workspace monorepo。
- `packages/sdk`：浏览器监控 SDK，包含错误、性能、行为、白屏、录屏和 reporter 插件。
- `apps/server`：Node HTTP API，使用 `node:sqlite` 持久化事件和 Source Map。
- `apps/dashboard`：React 监控看板。
- `examples/react-demo` 和 `examples/vue-demo`：接入示例。
- Docker Compose 可本地启动 server、dashboard、React demo 和 Vue demo。
- 单元测试覆盖 SDK、服务端查询和 Source Map。

本次交付不拆分为多个仓库，不引入 Kafka、ClickHouse、对象存储、登录系统或复杂告警系统。目标是让现有系统以低成本方式在线闭环运行。

## 3. 推荐部署架构

```text
React Demo on Vercel
  |
  | POST /api/events/batch
  v
Render Web Service: Node API
  |
  | MONITOR_DB_PATH=/data/monitor.db
  v
Render Persistent Disk: SQLite

Dashboard on Vercel
  |
  | GET /api/overview, /api/errors, /api/sessions
  v
Render Web Service: Node API
```

Render 负责运行 `apps/server`，并挂载 persistent disk 保存 SQLite 文件。Vercel 负责部署静态前端：dashboard 和 React demo。Vue demo 保持本地演示能力，若部署额度允许再作为第二个 Vercel 项目上线。所有前端通过构建时环境变量 `VITE_API_URL` 指向 Render API。

## 4. 生产配置

### 4.1 Server 环境变量

Render Web Service 配置：

- `PORT`：Render 自动提供或使用默认端口。
- `MONITOR_DB_PATH=/data/monitor.db`：SQLite 文件路径。
- `MONITOR_ALLOWED_ORIGINS`：逗号分隔的允许来源，包含 dashboard 和 demo 的 Vercel 域名。
- `MONITOR_RELEASE=0.1.0`：健康检查展示的版本号。

服务端启动时创建数据库 schema。健康检查返回：

```json
{
  "ok": true,
  "service": "pulseboard-api",
  "release": "0.1.0",
  "database": "ready"
}
```

健康检查不暴露磁盘路径、内部错误堆栈或敏感配置。

### 4.2 Frontend 环境变量

Dashboard：

- `VITE_API_URL=https://<render-service>.onrender.com`
- `VITE_APP_ID=react-demo`

React demo：

- `VITE_API_URL=https://<render-service>.onrender.com`

Vue demo：

- `VITE_API_URL=https://<render-service>.onrender.com`

示例应用不能再硬编码 `http://localhost:3000/api/events/batch`。endpoint 应由 `import.meta.env.VITE_API_URL` 生成，本地开发时回退到 `http://localhost:3000`。

## 5. 企业级轻量增强

### 5.1 CI

新增 GitHub Actions 工作流：

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
docker compose config
```

CI 不依赖 Render 或 Vercel 账号。Docker 构建可作为可选步骤，避免免费 CI 时间过长。

### 5.2 CORS 白名单

开发环境允许本地端口：

- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`

生产环境根据 `MONITOR_ALLOWED_ORIGINS` 返回 `access-control-allow-origin`。若请求来源不在白名单内，查询和上报接口返回 403。图片上报和 Beacon 上报仍必须遵守同一来源策略。

### 5.3 线上演示数据

为了避免面试官打开 dashboard 看到空页面，提供一个低风险方案：

- React demo 页面保留“触发错误、触发 Promise 拒绝、触发失败请求、上报数据”等按钮。
- 新增一个本地脚本，用于向线上 Render API 写入少量固定演示事件。
- README 中说明首次上线后如何生成演示数据。

默认不开放公开 seed 接口，避免任何人反复刷写数据库。演示数据只通过本地脚本触发，脚本代码随仓库公开，执行者需要显式传入线上 API 地址。

### 5.4 README 展示化

README 应新增：

- 在线地址：API、dashboard、React demo；Vue demo 标注为本地示例或可选线上示例。
- 架构图。
- 五分钟线上演示流程。
- 本地 Docker 运行方式。
- Render 部署 server 的步骤。
- Vercel 部署 dashboard 和 demo 的步骤。
- 环境变量表。
- 常见问题：Render 免费实例冷启动、SQLite 持久盘、CORS 配置、Node 版本要求。

### 5.5 部署验收清单

部署后执行：

1. 打开 Render API `/api/health`。
2. 打开 React demo，触发几类事件并上报。
3. 打开 dashboard，确认总览数值变化。
4. 查看错误聚合页面。
5. 查看性能页面。
6. 查看行为页面。
7. 打开 session replay 页面，确认录屏数据可播放或显示可理解的空态。
8. 调用 Source Map 上传和还原接口，确认返回还原结果。

## 6. 非目标

本次不做：

- 用户登录、组织、项目权限。
- 告警规则、邮件或 IM 通知。
- ClickHouse、Kafka、Redis、对象存储。
- SDK 发布到 npm。
- 高可用、多实例写入 SQLite。
- 私有化部署安装器。

这些能力适合后续版本，但当前阶段会增加成本和运维复杂度。

## 7. 测试策略

本地和 CI 运行：

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
docker compose config
```

上线后手动验收：

- Render API 健康检查返回 200。
- Dashboard 能读取 Render API。
- Demo 能向 Render API 上报。
- SQLite 数据在服务重启后仍存在。
- 生产 CORS 不允许未知来源直接调用 API。

## 8. 成功标准

- GitHub 仓库公开可读，CI 通过。
- Render server 可访问，健康检查正常。
- Vercel dashboard 和 demo 可访问。
- 用户在 demo 中触发事件后，dashboard 能看到数据变化。
- README 能让陌生开发者理解系统架构并复现部署。
- 简历中可以准确描述为：基于 TypeScript monorepo 的前端监控系统，包含 SDK 插件体系、Node 数据接收服务、SQLite 持久化、Source Map 还原、React dashboard 和线上演示闭环。
