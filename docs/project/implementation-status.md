# QuantFlow 实现状态地图

状态：持续更新｜最后核对：`v0.2.0-dev.5`（2026-06-25）

Agent 开始任务前必须先读本文，再读 `../dev/task-router.md` 与对应事实来源。**不要依据规格文档假设功能已实现。**

## 状态定义

| 状态          | 含义                                     |
| ------------- | ---------------------------------------- |
| `done`        | 已接入真实逻辑或基础设施，可用于后续开发 |
| `partial`     | 有部分实现，但未形成完整业务闭环         |
| `skeleton`    | 路由/页面/模块存在，主要为静态示例或占位 |
| `not-started` | 规格已定义，代码尚未开始                 |
| `disabled`    | 有意关闭，不得自行启用                   |

## 工程与运维

| 模块                      | 状态      | 代码位置                                  | 说明                                                               |
| ------------------------- | --------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Monorepo / pnpm workspace | `done`    | 根目录                                    | Web、Admin、API、Worker、共享包可构建                              |
| CI 门禁                   | `done`    | `.github/workflows/ci.yml`                | `pnpm check` + `pnpm build`                                        |
| 生产部署                  | `partial` | `deploy/`、`scripts/deploy-production.sh` | VPS Compose 已上线；统一 release 镜像；R2 备份、WAL、Sentry 待落地 |
| 本地 PostgreSQL           | `done`    | `compose.yaml`                            | 开发依赖                                                           |
| 品牌资源同步              | `done`    | `scripts/sync-brand-assets.mjs`           | dev/build 前同步到 Web/Admin                                       |

## 前端

| 模块           | 状态          | 路由 / 位置                       | 说明                                               |
| -------------- | ------------- | --------------------------------- | -------------------------------------------------- |
| 官网 `/`       | `skeleton`    | `apps/web/app/page.tsx`           | 营销页骨架，静态内容                               |
| 应用工作台壳层 | `partial`     | `apps/web/app/app/layout.tsx`     | 顶部/底部导航骨架；proxy 已强制登录                |
| 用户端登录     | `partial`     | `apps/web/app/login`              | 邮箱 OTP + Turnstile UI 已接 API；业务权益待接入   |
| 策略广场       | `skeleton`    | `/app/strategies`                 | 前端硬编码示例策略，未接 API                       |
| 策略详情       | `not-started` | `/app/strategies/[id]`            | 卡片链接存在，详情页未实现                         |
| 信号中心       | `skeleton`    | `/app/signals`                    | 静态空态/示例                                      |
| 模拟盘         | `skeleton`    | `/app/paper-trading`              | 静态空态/示例                                      |
| 个人中心       | `skeleton`    | `/app/profile`                    | 静态占位                                           |
| 会员订阅       | `not-started` | 无独立路由                        | 规格在 `membership-plans.md`                       |
| 通知中心       | `not-started` | 无路由                            | 仅规格                                             |
| 管理后台壳层   | `partial`     | `apps/admin/app/admin/layout.tsx` | 侧栏与页面框架；proxy 已强制管理员登录             |
| 管理端登录     | `partial`     | `apps/admin/app/login`            | 邮箱 OTP + Turnstile UI 已接 API；完整 RBAC 待接入 |
| 管理端各列表页 | `skeleton`    | `/admin/*`                        | 静态指标与表格示例，未接 API/RBAC                  |

## 后端 API

| 模块               | 状态          | 路径 / 位置                                                 | 说明                                                                              |
| ------------------ | ------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 健康检查           | `done`        | `GET /api/v1/health`                                        | `apps/api/src/modules/health`                                                     |
| Feature flags      | `done`        | `GET /api/v1/system/feature-flags`                          | 只读；未来能力均为 `false`                                                        |
| 邮箱 OTP 认证      | `partial`     | `POST /api/v1/auth/email-otp/*`、`GET /api/v1/auth/session` | 领域服务、Resend/Turnstile adapter、登录 UI、session guard 已有；限流清理任务待接 |
| 策略               | `not-started` | —                                                           | 无模块、无表、无 API                                                              |
| 信号               | `not-started` | —                                                           | 无模块、无表、无 API                                                              |
| 模拟盘             | `not-started` | —                                                           | 无模块、无表、无 API                                                              |
| 会员 / 权益        | `not-started` | —                                                           | 无模块、无表、无 API                                                              |
| 风控               | `not-started` | —                                                           | 无模块、无表、无 API                                                              |
| 通知               | `not-started` | —                                                           | 无模块、无表、无 API                                                              |
| 管理端 RBAC / 审计 | `not-started` | —                                                           | 无守卫、无审计写入                                                                |

## 数据与后台任务

| 模块              | 状态          | 位置                     | 说明                                   |
| ----------------- | ------------- | ------------------------ | -------------------------------------- |
| Prisma / 数据库   | `partial`     | `apps/api/prisma/`       | 认证基础与管理员预授权 migration 已有  |
| 行情采集          | `not-started` | `apps/worker`            | Worker 仅 heartbeat，无 CoinGecko 任务 |
| Outbox / 异步任务 | `not-started` | `apps/worker`            | 未注册                                 |
| 数据库备份到 R2   | `not-started` | `docs/dev/deployment.md` | 规格已定，脚本未落地                   |

## 有意关闭的能力

| 能力              | 状态       | 说明                                                     |
| ----------------- | ---------- | -------------------------------------------------------- |
| 交易所连接        | `disabled` | `enableExchangeConnection=false`                         |
| 半自动 / 自动交易 | `disabled` | 相关 flag 固定 `false`                                   |
| 作者门户          | `disabled` | `enableAuthorPortal=false`                               |
| 生产在线支付      | `disabled` | `enableProductionPayments=false`；仅人工/邀请码/测试开通 |

## 代码优先的事实来源

实现细节以代码和迁移为准；文档解释“为什么”。冲突时按 `../README.md` 的冲突处理顺序执行。

| 主题            | 运行时事实来源                                | 规格文档                                          |
| --------------- | --------------------------------------------- | ------------------------------------------------- |
| HTTP 契约       | `packages/contracts`、`apps/api` 控制器与测试 | `../api/api-spec.md`                              |
| 数据模型        | `apps/api/prisma/schema.prisma`、migrations   | `../architecture/database-schema.md`              |
| Feature flags   | `packages/contracts`                          | `../api/api-spec.md`                              |
| 权限与权益      | 服务端守卫与 entitlement（待实现）            | `../security/roles-and-permissions.md`            |
| 策略 / 模拟规则 | 领域模块与单元测试（待实现）                  | `../strategy/strategy-and-paper-trading-rules.md` |

## 维护规则

1. 完成可验证垂直切片后更新本文件对应行，不要等“整个模块做完”再改。
2. 只改状态、位置和一句说明；不要把业务规则复制进本文。
3. 发布或合并影响实现范围的 PR 时，同步更新 `versioning-and-changelog.md`。
4. 新增 P0 模块时先在 `mvp-scope-and-roadmap.md` 登记，再在本文件加一行 `not-started`。
