# QuantFlow 实现状态地图

状态：持续更新｜最后核对：`v0.3.0-dev.4`（2026-06-26）

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

| 模块           | 状态          | 路由 / 位置                       | 说明                                                              |
| -------------- | ------------- | --------------------------------- | ----------------------------------------------------------------- |
| 官网 `/`       | `partial`     | `apps/web/app/page.tsx`           | 营销页已接策略 API 预览；定价区仍为静态说明                       |
| 应用工作台壳层 | `partial`     | `apps/web/app/app/layout.tsx`     | 桌面侧边栏与移动底部导航；proxy 已强制登录                        |
| 用户端登录     | `partial`     | `apps/web/app/login`              | 邮箱 OTP + Turnstile UI 已接 API；业务权益待接入                  |
| 策略广场       | `partial`     | `/app/strategies`                 | 已接策略 API；支持风险/类型/排序筛选与服务端分页                  |
| 策略详情       | `partial`     | `/app/strategies/[id]`            | 已接详情 API、多周期指标、历史信号与订阅/取消；模拟盘创建仍待接入 |
| 信号中心       | `partial`     | `/app/signals`                    | 已接信号列表/详情、方向/状态筛选与分页；收藏、提醒待接入          |
| 我的策略       | `partial`     | `/app/my-strategies`              | 已展示当前订阅策略；配额来自会员权益                              |
| 模拟盘         | `skeleton`    | `/app/paper-trading`              | 静态空态/示例                                                     |
| 个人中心       | `partial`     | `/app/profile`                    | 已展示会话、会员权益配额与安全事件；通知偏好待接入                |
| 会员订阅       | `partial`     | `/app/membership`                 | 计划列表与模拟开通（非真实扣款）；生产支付仍关闭                  |
| 通知中心       | `not-started` | 无路由                            | 仅规格                                                            |
| 管理后台壳层   | `partial`     | `apps/admin/app/admin/layout.tsx` | 侧栏与页面框架；proxy 已强制管理员登录                            |
| 管理端登录     | `partial`     | `apps/admin/app/login`            | 邮箱 OTP + Turnstile UI 已接 API；完整 RBAC 待接入                |
| 管理端策略治理 | `partial`     | `/admin/strategies`               | 已接最小创建、提审、批准、拒绝、暂停、下架和审计                  |
| 管理端其他页   | `skeleton`    | `/admin/*`                        | 静态指标与表格示例，未接完整 API/RBAC                             |

## 后端 API

| 模块               | 状态          | 路径 / 位置                                                                                   | 说明                                                                                                                |
| ------------------ | ------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 健康检查           | `done`        | `GET /api/v1/health`                                                                          | `apps/api/src/modules/health`                                                                                       |
| Feature flags      | `done`        | `GET /api/v1/system/feature-flags`                                                            | 只读；未来能力均为 `false`                                                                                          |
| 邮箱 OTP 认证      | `partial`     | `POST /api/v1/auth/email-otp/*`、`GET /api/v1/auth/session`、`GET /api/v1/me/security-events` | 领域服务、Resend/Turnstile adapter、登录 UI、session guard 已有；会话 membershipPlan 来自权益服务；限流清理任务待接 |
| 策略               | `partial`     | `GET/POST /api/v1/strategies*`、`/api/v1/admin/strategies*`                                   | 用户端列表/详情/订阅与管理端最小审核流已接；列表支持类型/排序筛选；详情含多周期指标与近期信号                       |
| 信号               | `partial`     | `GET /api/v1/signals*`                                                                        | 按订阅可见的信号列表与详情；支持 `direction`、`status` 筛选与分页；收藏、提醒和加入模拟盘待接                       |
| 模拟盘             | `not-started` | —                                                                                             | 无模块、无表、无 API                                                                                                |
| 会员 / 权益        | `partial`     | `GET/POST /api/v1/membership/*`                                                               | 计划、订阅、权益查询与 `mock-checkout` 模拟开通；`enableProductionPayments` 仍为 false                              |
| 风控               | `not-started` | —                                                                                             | 无模块、无表、无 API                                                                                                |
| 通知               | `not-started` | —                                                                                             | 无模块、无表、无 API                                                                                                |
| 管理端 RBAC / 审计 | `partial`     | `admin_audit_logs`、策略管理 API                                                              | 策略 mutation 已写审计；完整角色权限矩阵待接                                                                        |

## 数据与后台任务

| 模块              | 状态          | 位置                     | 说明                                                                             |
| ----------------- | ------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Prisma / 数据库   | `partial`     | `apps/api/prisma/`       | 认证、管理员预授权、策略/信号、订阅、会员计划/权益/订阅和策略审计 migration 已有 |
| 行情采集          | `not-started` | `apps/worker`            | Worker 仅 heartbeat，无 CoinGecko 任务                                           |
| Outbox / 异步任务 | `not-started` | `apps/worker`            | 未注册                                                                           |
| 数据库备份到 R2   | `not-started` | `docs/dev/deployment.md` | 规格已定，脚本未落地                                                             |

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
| 权限与权益      | 服务端守卫与 membership entitlements（部分）  | `../security/roles-and-permissions.md`            |
| 策略 / 模拟规则 | 领域模块与单元测试（待实现）                  | `../strategy/strategy-and-paper-trading-rules.md` |

## 维护规则

1. 完成可验证垂直切片后更新本文件对应行，不要等“整个模块做完”再改。
2. 只改状态、位置和一句说明；不要把业务规则复制进本文。
3. 发布或合并影响实现范围的 PR 时，同步更新 `versioning-and-changelog.md`。
4. 新增 P0 模块时先在 `mvp-scope-and-roadmap.md` 登记，再在本文件加一行 `not-started`。
