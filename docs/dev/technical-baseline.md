# QuantFlow 技术与运行基线

状态：`v0` 技术选型已确定｜依赖使用锁文件固定 patch 版本

## 1. Monorepo

- Node.js `24.x LTS`，生产和 CI 使用同一 major/minor。
- pnpm `11.x` workspaces，根 `packageManager` 固定实际安装版本。
- TypeScript `6.0.x` strict；ESM 优先。
- Turborepo 仅用于任务编排与缓存，不承载业务规则。

```text
apps/
  web/       Next.js 官网 `/` 与应用工作台 `/app`
  admin/     Next.js 管理后台 `/admin`
  api/       NestJS 模块化单体 HTTP API
  worker/    NestJS standalone 后台任务
packages/
  ui/        共享组件与 v0 design tokens
  contracts/ API schema、错误码、生成类型
  config/    ESLint、TypeScript、测试和环境配置
```

## 2. 前端

- Next.js `16.2.x` App Router、React `19.2.x`。
- Tailwind CSS `4.3.x`；全局 token 放在 `packages/ui`，业务页面禁止散落 hex 与任意尺度。
- TanStack Query `5.x` 管理服务端状态；URL 管理筛选、排序和分页。
- Zod `4.x` 负责表单与运行时边界校验。
- ECharts `6.x` 统一应用工作台和管理端图表。
- Lucide React 统一图标。
- Vitest + Testing Library 做单元/组件测试，Playwright 做核心 E2E 与视口测试。

路由边界：

- `apps/web` 承载根路径 `/` 官网营销页和 `/app` 应用工作台。官网与应用端共用基础 design tokens，但使用不同 layout 和信息密度。
- `/` 官网负责品牌、信任、转化和风险教育，主 CTA 为“进入应用”。
- `/app` 应用工作台负责策略、信号、模拟盘、会员和个人中心；必须将 `/app` 重定向到 `/app/strategies`，桌面端使用顶部导航。
- `apps/admin` 承载 `/admin` 管理后台，强调高密度表格、筛选、状态管理和操作效率。

## 3. 后端与数据库

- NestJS `11.1.x` 模块化单体；REST `/api/v1` + OpenAPI。
- 后端采用轻量 DDD：核心领域模块区分 `domain`、`application`、`infrastructure`、`interfaces`；简单模块允许适度简化。
- MVP 不使用微服务、复杂 CQRS 或 Event Sourcing。
- Prisma `7.8.x` + PostgreSQL `18.x`。
- 金额和比例使用 Prisma Decimal / PostgreSQL numeric；API 使用十进制字符串。
- MVP 不引入 Redis、RabbitMQ 或微服务。后台任务使用 PostgreSQL outbox + worker 轮询；出现经测量的吞吐瓶颈后再立 ADR。
- 领域事件允许使用本地事件或 PostgreSQL outbox，例如 `StrategySignalGenerated`、`PaperOrderExecuted`、`RiskEventTriggered`；第一版不引入复杂事件总线。
- Resend adapter 发送用户端和管理端 OTP 邮件；会话和验证码由后端管理。

依赖升级策略：锁定 patch，Dependabot/Renovate 每周提 PR；minor 需全套 CI，major 必须 ADR 和迁移说明。不得在文档中使用无上限的 `latest`。

## 4. 行情数据

- 主供应商：CoinGecko API；开发/测试使用 Demo key，生产使用 Pro key。
- MVP 交易对：BTCUSDT、ETHUSDT、SOLUSDT；通过内部 symbol mapping 隔离供应商 ID。
- worker 每 60 秒拉取价格快照；快照年龄超过 120 秒视为 stale，拒绝新模拟成交；连续 5 分钟无有效数据时暂停受影响模拟盘并告警。
- 保留期：分钟价格快照 90 天、5 分钟 K 线 180 天、1 小时与 1 日 K 线 2 年。过期数据按批次清理。
- 所有展示和撮合记录 `source`、`captured_at`、`is_stale`。不得把 CoinGecko 数据描述为交易所实时成交价。

供应商只存在于 adapter；API、领域规则和数据库不得依赖 CoinGecko 字段名，以便后续替换或增加第二数据源。

## 5. 环境

- `local`：Docker Compose PostgreSQL 18；邮件和行情默认 fake，可显式使用 sandbox key。
- `test`：隔离 PostgreSQL schema/database，固定 fixture，禁止调用外部邮件、行情和支付。
- `staging`：与生产同构的独立 Compose project；使用独立数据库、Resend、行情和 Cloudflare Turnstile key。
- `production`：现有共享 Ubuntu VPS 上的独立 QuantFlow Docker Compose project；公网只经 Cloudflare Tunnel 进入。

## 6. 生产部署

- Web、Admin、API、Worker 和 PostgreSQL 18 使用独立 Docker Compose project 部署；应用端口只绑定 `127.0.0.1`，数据库和 Worker 仅在 Compose network 内可见。
- 复用服务器已有 `cloudflared` 服务；Cloudflare Tunnel 提供公网入口，Cloudflare 负责 DNS、边缘 TLS、DDoS/WAF、有限静态缓存和 Turnstile。
- Docker 日志启用轮转，Sentry 收集前后端异常，Cloudflare Analytics 观察边缘流量与安全事件；审计日志按业务保留策略存数据库。
- 生产数据库仅在 VPS 本地执行每日 `pg_dump` 全量备份与 WAL 归档；每季度执行隔离恢复演练。MVP 不做 R2 或其他异地对象存储备份。
- 发布使用固定 commit/image tag、健康检查和可回滚 Compose 更新；数据库 migration 必须向后兼容并提供回滚/前滚说明。完整规范见 `deployment.md`。

## 7. CI 门禁

每个 PR 依次运行 install-lockfile、format check、lint、typecheck、unit、contract、build；影响核心路径时运行 Playwright。migration 运行 schema diff 和测试数据库升级。生产发布前执行安全、权限、风险文案和无实盘入口扫描。

官方基线来源：[Node.js releases](https://nodejs.org/en/about/previous-releases)、[Next.js](https://nextjs.org/blog)、[PostgreSQL versions](https://www.postgresql.org/support/versioning/)、[CoinGecko API](https://docs.coingecko.com/reference/introduction)、[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)、[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。
