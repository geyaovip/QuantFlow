# QuantFlow 实现状态地图

状态：持续更新｜最后核对：`v0.7.0-dev.1`（2026-06-27）

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

| 模块                      | 状态      | 代码位置                                                                 | 说明                                             |
| ------------------------- | --------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| Monorepo / pnpm workspace | `done`    | 根目录                                                                   | Web、Admin、API、Worker、共享包可构建            |
| CI 门禁                   | `done`    | `.github/workflows/ci.yml`、`.github/workflows/e2e.yml`                  | `pnpm check` + `pnpm build`；全栈 E2E 可手动触发 |
| 生产部署                  | `partial` | `deploy/`、`scripts/*backup*`、`scripts/setup-production-backup-cron.sh` | VPS Compose 已上线；本地全量备份与 WAL cron 已装 |
| 本地 PostgreSQL           | `done`    | `compose.yaml`                                                           | 开发依赖                                         |
| 品牌资源同步              | `done`    | `scripts/sync-brand-assets.mjs`                                          | dev/build 前同步到 Web/Admin                     |

## 前端

| 模块           | 状态      | 路由 / 位置                                  | 说明                                                                      |
| -------------- | --------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 官网 `/`       | `partial` | `apps/web/app/page.tsx`                      | 营销页已接策略 API 预览与会员计划 API 定价区；板块与视觉层级已优化        |
| 应用工作台壳层 | `partial` | `apps/web/app/app/layout.tsx`                | 桌面侧边栏与移动底部导航；proxy 已强制登录                                |
| 用户端登录     | `partial` | `apps/web/app/login`                         | 邮箱 OTP + Turnstile UI 已接 API；业务权益待接入                          |
| 策略广场       | `partial` | `/app/strategies`                            | 已接策略 API；支持风险/类型/币种/免费/模拟盘筛选与多维度排序              |
| 策略详情       | `partial` | `/app/strategies/[id]`                       | 已接详情 API、多周期指标、历史信号与订阅/取消；已订阅用户可直接创建模拟盘 |
| 信号中心       | `partial` | `/app/signals`                               | 已接信号列表/详情；支持方向/状态/是否已用于模拟筛选；默认展示全部状态     |
| 我的策略       | `partial` | `/app/my-strategies`                         | 已展示当前订阅策略；配额来自会员权益；空态和概览已优化                    |
| 模拟盘         | `partial` | `/app/paper-trading`                         | 生命周期完整；权益/回撤曲线；重置；策略暂停联动与恢复复检                 |
| 个人中心       | `partial` | `/app/profile`                               | 已展示会话、会员权益配额与安全事件；可跳转通知偏好设置                    |
| 会员订阅       | `partial` | `/app/membership`                            | 计划列表、Plisio 支付、邀请码兑换与 mock 开通；回调成功后自动开通         |
| 通知中心       | `partial` | `/app/notifications`                         | 站内通知列表、标记已读与偏好设置页                                        |
| 管理后台壳层   | `partial` | `apps/admin/app/admin/layout.tsx`            | 侧栏与页面框架；proxy 已强制管理员登录                                    |
| 管理端登录     | `partial` | `apps/admin/app/login`                       | 邮箱 OTP + Turnstile UI 已接 API；RBAC 已接入                             |
| 管理端策略治理 | `partial` | `/admin/strategies`                          | 已接最小创建、提审、批准、拒绝、暂停、下架和审计                          |
| 管理端信号治理 | `partial` | `/admin/signals`                             | 信号列表、取消、标记异常、重推与审计；异常写入平台风险事件                |
| 管理端模拟盘   | `partial` | `/admin/paper-accounts`                      | 列表、治理操作与详情页；写审计日志                                        |
| 管理端用户治理 | `partial` | `/admin/users`                               | 用户列表、状态变更与人工开通会员                                          |
| 管理端风险治理 | `partial` | `/admin/risk`                                | 平台风险事件列表与分派/解决/忽略/升级                                     |
| 管理端权限     | `partial` | `/admin/access`                              | 角色列表与管理员角色分配                                                  |
| 管理端看板     | `partial` | `/admin`                                     | 汇总指标与最近风险事件                                                    |
| 管理端审计     | `partial` | `/admin/audit`                               | 审计日志列表                                                              |
| 管理端其他页   | `partial` | `/admin/memberships`、`/admin/announcements` | 会员订阅列表/取消、邀请码创建/停用与系统公告创建/发布已接 API             |

## 后端 API

| 模块               | 状态      | 路径 / 位置                                                                                                                  | 说明                                                                                        |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 健康检查           | `done`    | `GET /api/v1/health`、`/health/ready`、`/health/live`                                                                        | 就绪探针含数据库连通性；生产部署与回滚脚本使用 `/health/ready`                              |
| Feature flags      | `done`    | `GET /api/v1/system/feature-flags`                                                                                           | 只读；实盘相关未来能力固定 `false`，生产会员支付可由 env 开启                               |
| 邮箱 OTP 认证      | `partial` | `POST /api/v1/auth/email-otp/*`、`GET /api/v1/auth/session`、`GET /api/v1/me/security-events`                                | Worker 每小时清理过期 OTP/会话；E2E 测试 OTP 助手仅 `NODE_ENV=test` 可用                    |
| 策略               | `partial` | `GET/POST /api/v1/strategies*`、`/api/v1/admin/strategies*`                                                                  | 用户端列表/详情/订阅与管理端最小审核流已接；`requiredTier` 与 `history_days` 服务端强制执行 |
| 信号               | `partial` | `GET /api/v1/signals*`                                                                                                       | 按订阅可见的信号列表与详情；支持 `direction`、`status` 筛选与分页；可驱动模拟盘创建与执行   |
| 模拟盘             | `partial` | `GET/POST/DELETE /api/v1/paper-accounts*`、`/admin/paper-accounts*`、`GET /market/symbols*`                                  | 重置、策略暂停联动、恢复复检、`MARKET_DATA_STALE`、信号 `usedInPaperTrading`                |
| 会员 / 权益        | `partial` | `GET/POST /api/v1/membership/*`                                                                                              | 计划、订阅、权益、邀请码兑换、Plisio checkout/callback 与测试 mock-checkout                 |
| 风控               | `partial` | `GET/POST /api/v1/admin/risk-events*`                                                                                        | 平台风险事件表与治理 API；信号异常与模拟盘拒绝/重置双写                                     |
| 通知               | `partial` | `GET/PATCH /api/v1/notifications*`、`notification-preferences`                                                               | 站内通知与偏好；策略暂停/模拟开通/会员/信号重推/公告触发提醒                                |
| 管理端 RBAC / 审计 | `partial` | `admin_roles`、`admin_audit_logs`、`GET /admin/*` governance APIs                                                            | RBAC 种子、策略/模拟盘/信号/治理权限校验；审计列表与 mutation 写日志                        |
| 管理端治理         | `partial` | `GET /admin/dashboard`、`/admin/users*`、`/admin/subscriptions*`、`/admin/membership-invite-codes*`、`/admin/announcements*` | 看板、用户状态、人工开通会员、邀请码管理、订阅取消、系统公告发布                            |

## 数据与后台任务

| 模块              | 状态      | 位置                                         | 说明                                                                                           |
| ----------------- | --------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Prisma / 数据库   | `partial` | `apps/api/prisma/`                           | 认证、策略/信号、会员、邀请码、风险确认留痕、模拟盘、RBAC、通知、风险事件、公告 migration 已有 |
| 行情采集          | `partial` | `apps/worker`、`GET /api/v1/market/symbols*` | Worker 每 60s 刷新快照（CoinGecko 或信号回退）；公开行情查询含 `isStale`                       |
| Outbox / 异步任务 | `partial` | `apps/worker`                                | 行情刷新 + 认证记录清理；Outbox 未注册                                                         |
| E2E 冒烟测试      | `partial` | `packages/e2e`、`.github/workflows/e2e.yml`  | API/Web 登录 journey、模拟盘创建、策略页性能；CI 每周一与手动触发全栈 E2E                      |
| 数据库本地备份    | `partial` | `scripts/backup-database.sh` 等              | VPS 全量/WAL 本地归档与 cron；季度恢复演练待运维执行                                           |
| 可观测性          | `partial` | `SENTRY_DSN`、`NEXT_PUBLIC_SENTRY_DSN`       | API + Web/Admin Sentry 与 `global-error` 边界可选接入                                          |

## 有意关闭的能力

| 能力              | 状态       | 说明                                                                      |
| ----------------- | ---------- | ------------------------------------------------------------------------- |
| 交易所连接        | `disabled` | `enableExchangeConnection=false`                                          |
| 半自动 / 自动交易 | `disabled` | 相关 flag 固定 `false`                                                    |
| 作者门户          | `disabled` | `enableAuthorPortal=false`                                                |
| 生产在线支付      | `partial`  | `enableProductionPayments` 由生产 env 开启；Plisio 仅允许 USDT_BSC / USDT |

## 代码优先的事实来源

实现细节以代码和迁移为准；文档解释“为什么”。冲突时按 `../README.md` 的冲突处理顺序执行。

| 主题            | 运行时事实来源                                | 规格文档                                          |
| --------------- | --------------------------------------------- | ------------------------------------------------- |
| HTTP 契约       | `packages/contracts`、`apps/api` 控制器与测试 | `../api/api-spec.md`                              |
| 数据模型        | `apps/api/prisma/schema.prisma`、migrations   | `../architecture/database-schema.md`              |
| Feature flags   | `packages/contracts`                          | `../api/api-spec.md`                              |
| 权限与权益      | 服务端守卫与 membership entitlements（部分）  | `../security/roles-and-permissions.md`            |
| 策略 / 模拟规则 | 领域模块与单元测试（部分）                    | `../strategy/strategy-and-paper-trading-rules.md` |

## 维护规则

1. 完成可验证垂直切片后更新本文件对应行，不要等“整个模块做完”再改。
2. 只改状态、位置和一句说明；不要把业务规则复制进本文。
3. 发布或合并影响实现范围的 PR 时，同步更新 `versioning-and-changelog.md`。
4. 新增 P0 模块时先在 `mvp-scope-and-roadmap.md` 登记，再在本文件加一行 `not-started`。
