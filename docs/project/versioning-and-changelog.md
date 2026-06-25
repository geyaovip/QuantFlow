# QuantFlow 版本与变更记录

状态：持续更新｜范围事实来源：`mvp-scope-and-roadmap.md`

## 版本规则

- `v0.x`：开发和内部验证阶段。
- `v1.0.0`：策略、信号、模拟盘、会员和管理治理的 MVP。
- `v1.x`：不改变“仅模拟、不实盘”边界的增强版本。
- 任何实盘能力都必须使用新的 major 版本并重新完成产品、安全、风控和合规评审；当前不承诺具体版本号。

Major 表示产品或兼容性边界变化，Minor 表示向后兼容能力，Patch 表示兼容修复。文档基线单独使用 `docs-vX.Y.Z`。

## 发布门禁

每个发布必须说明范围、风险/权限影响、迁移、测试、监控和回滚。`v1.0.0` 的完整门禁见 `../testing/acceptance-criteria.md`。

## 记录模板

```markdown
## vX.Y.Z - YYYY-MM-DD

- 类型：Added / Changed / Fixed / Removed / Security / Risk / Docs / Ops
- 摘要：
- MVP 边界影响：无 / 说明
- API / 数据 / 权限 / 风控影响：
- 迁移与兼容：
- 验证：
- 监控与回滚：
```

## 变更记录

### `v0.2.0-dev.5` - 2026-06-25

- 类型：Added / Security / Ops / Docs
- 摘要：新增 `/auth/session` 会话校验 API，Web `/app/*` 与 Admin `/admin/*` proxy 强制校验对应 audience session；生产 Cookie domain 改为 `.quantflow.chat`；新增管理员预授权 migration，仅 `geyaovip@163.com` 保持启用；生产部署改为单一 release 镜像并修复 GitHub runner 公网校验被 Cloudflare 403 误判失败的问题。
- MVP 边界影响：无；未增加交易所连接、真实下单、半自动/自动交易或在线支付入口。
- API / 数据 / 权限 / 风控影响：新增 `GET /api/v1/auth/session`；新增 migration `202606250002_seed_admin_user`；管理员验证码仅对启用的 `admin_users` 发送，其他管理员邮箱不发送验证码。
- 迁移与兼容：生产必须配置 `AUTH_COOKIE_DOMAIN=.quantflow.chat`；旧 host-only Cookie 需要用户重新登录。
- 验证：API/Web/Admin typecheck、API auth tests、`pnpm check`、`pnpm build`。
- 监控与回滚：如 guard 导致误拦截，可回滚 proxy 或恢复上一镜像 tag；数据库 seed migration 可前滚调整管理员状态。

### `v0.2.0-dev.4` - 2026-06-25

- 类型：Added / Frontend / Security / SEO / Docs
- 摘要：新增用户端 `/login` 与管理端 `/login` 邮箱验证码登录页，接入 Cloudflare Turnstile 前端组件和 Resend OTP API；官网 CTA 改为先进入登录页；补充 API CORS credentials 白名单；新增官网 metadata、robots 与 sitemap。
- MVP 边界影响：无；未增加交易所连接、真实下单、半自动/自动交易或在线支付入口。
- API / 数据 / 权限 / 风控影响：API 允许官网与管理端来源携带凭证调用认证接口；登录页仍只处理会话创建，业务页面 guard、RBAC 守卫和审计写入仍待后续切片。
- 迁移与兼容：无数据库迁移；生产需保持 `TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、`RESEND_API_KEY` 和 `AUTH_ALLOWED_ORIGINS` 配置。
- 验证：`pnpm --filter @quantflow/web typecheck`、`pnpm --filter @quantflow/admin typecheck`、`pnpm --filter @quantflow/api typecheck`。
- 监控与回滚：认证请求失败不会签发会话；可回滚登录页入口到静态应用入口，但不影响后端 OTP 基础能力。

### `docs-v0.5.0` - 2026-06-25

- 类型：Docs / Ops
- 摘要：为 AI 全自动开发优化文档体系；新增实现状态地图与任务路由；压缩 `AGENTS.md` 重复内容；决策日志增加 ADR 状态与 Agent 约束列；明确代码/迁移/测试为运行时事实来源。
- MVP 边界影响：无。
- API / 数据 / 权限 / 风控影响：无；仅文档与 Agent 执行路径变化。
- 验证：`./scripts/check-docs.sh`、`pnpm check`。
- 监控与回滚：文档变更可通过 Git 回滚；`implementation-status.md` 需随实现持续更新。

### `v0.2.0-dev.3` - 2026-06-25

- 类型：Added / Security / Backend / Ops / Docs
- 摘要：新增 Prisma 7 数据库配置、认证基础 migration、用户/管理员邮箱 OTP 领域服务、Resend 发信 adapter、Cloudflare Turnstile 服务端校验 adapter、认证 API 控制器和生产迁移发布步骤。
- MVP 边界影响：无；未增加交易所连接、真实下单、半自动/自动交易或在线支付入口。
- API / 数据 / 权限 / 风控影响：新增 `/api/v1/auth/email-otp/request`、`/api/v1/auth/email-otp/verify`、`/api/v1/auth/logout` 的初始实现；新增 `users`、`admin_users`、`auth_email_challenges`、`auth_sessions`、`user_security_events` 表；管理端仍只允许预授权 `admin_users` 登录。
- 迁移与兼容：首次业务 migration `202606250001_auth_foundation`；生产发布脚本在启动服务前执行 `prisma migrate deploy`。生产环境必须配置新的 Resend API Key、发信域名、Turnstile keys 和 OTP pepper，否则 API 启动失败。
- 验证：`pnpm --filter @quantflow/api db:generate`、`pnpm check`、`pnpm build` 通过；API 3 个测试文件 8 项、contracts 3 项测试通过。
- 监控与回滚：Resend 投递失败不会签发会话；验证码和 session 只保存 hash。域名 DNS 传播、Turnstile widget 创建和生产环境变量仍需上线前确认。

### `v0.2.0-dev.2` - 2026-06-23

- 类型：Ops / Fixed / Docs
- 摘要：创建私有 GitHub 仓库与 production environment，接入 GitHub Actions SSH 发布；在现有 Ubuntu VPS 启动 Web、Admin、API、Worker 和独立 PostgreSQL 18，并将 `quantflow.chat`、`www`、`admin`、`api` 接入 Cloudflare Tunnel。
- MVP 边界影响：无；五个未来能力开关在线上均验证为 `false`，未增加实盘或在线支付入口。
- API / 数据 / 权限 / 风控影响：健康检查与只读 feature flags 已上线；认证、Resend OTP、RBAC 和业务数据库 schema 仍未实现。
- 迁移与兼容：首次创建生产数据库；PostgreSQL 18 volume 使用 `/var/lib/postgresql` 的版本化目录布局，无既有数据迁移。
- 验证：本地 `pnpm check`、GitHub CI、生产发布任务、Compose 健康检查、HTTPS 页面/API、用户端与管理端路由检查通过。
- 监控与回滚：发布脚本记录健康镜像 tag 并支持失败回滚；Cloudflare Tunnel 与服务器 ingress 已验证。R2 备份、WAL 归档、Sentry 和告警仍待后续落地。

### `v0.2.0-dev.1` - 2026-06-23

- 类型：Added / Architecture / Frontend / Backend / Ops
- 摘要：初始化 pnpm monorepo；新增 Next.js 官网/应用工作台、独立管理端、NestJS API/Worker、共享 UI/契约包、品牌同步、PostgreSQL Compose、容器构建和 CI 门禁。
- MVP 边界影响：只实现策略示例与模拟盘空态；未增加真实交易所、真实订单、自动交易或在线支付入口。
- API / 数据 / 权限 / 风控影响：新增健康检查和只读 feature flags 接口；所有未来能力固定为 `false`；认证、数据库迁移和 RBAC 尚未实现。
- 迁移与兼容：首次代码初始化，无既有应用迁移；生产数据库尚未创建。
- 验证：文档、格式、lint、TypeScript、5 项测试、Next/Nest 生产构建、桌面与移动端视觉检查通过。
- 监控与回滚：该开发切片完成时尚未发布生产；后续生产发布见 `v0.2.0-dev.2`。下一切片优先实现 PostgreSQL schema 与 Resend/Turnstile OTP。

### `docs-v0.4.0` - 2026-06-23

- 类型：Docs / Architecture / Security / Ops
- 摘要：生产部署由 AWS ECS/RDS 改为现有 Ubuntu VPS 上的独立 Docker Compose project；接入 Cloudflare Tunnel、DNS/TLS、WAF、Turnstile、静态缓存和 R2 备份，并确定独立目录、端口、密钥、发布与恢复规范。
- MVP 边界影响：无；不增加实盘或在线支付能力。
- API / 数据 / 权限 / 风控影响：生产 OTP 请求新增 `turnstile_token` 服务端校验；后端 IP + 邮箱限流仍为强制安全边界。
- 迁移与兼容：D-027 替代 D-019；当前尚无生产工作负载，无云资源迁移，仅更新开发前部署基线。
- 验证：旧 AWS 当前基线引用清理；Cloudflare ingress 示例、文档链接、部署端口和认证验收一致性检查通过。
- 监控与回滚：Cloudflare Analytics + Sentry + Docker 日志；固定镜像 tag 回滚；数据库使用完整备份与 WAL 归档恢复。

### `docs-v0.3.3` - 2026-06-23

- 类型：Docs / Design / Frontend
- 摘要：导入 QuantFlow SVG 品牌母版，以平滑曲线优化原始阶梯边缘，建立可复现的 favicon、Apple、PWA、用户端、管理端与局部深色表面资源体系，并补充使用规范和 manifest 示例。
- MVP 边界影响：无；深色 Logo 仅服务局部深色表面，不启用 MVP 深色主题。
- API / 数据 / 权限 / 风控影响：无。
- 验证：仓库只保留平滑且光学居中的正式母版；8 项 PNG 尺寸、favicon 小尺寸辨识度、高分辨率边缘、用户端和管理端横版组合通过本地渲染检查。
- 监控与回滚：品牌资源通过生成脚本统一维护；如母版变化，重新生成全套资源并进行视觉回归。

### `docs-v0.3.2` - 2026-06-23

- 类型：Docs / Product / API / Architecture
- 摘要：修复 Cursor 补充文档后的范围和契约冲突；CTA 中文化，行情中心与内容管理移至 P1，固定 `/app` 重定向和桌面顶部导航，补齐“我的策略”API，精简无支付订阅状态，统一 PostgreSQL 原生分区与缓存策略。
- MVP 边界影响：P0 不再包含用户行情中心或后台 CMS；官网内容由代码/配置维护。
- API / 数据 / 权限 / 风控影响：新增当前用户策略订阅列表；移除支付衍生订阅状态和 provider source；会员风险文案改为申请/开通语义。
- 验证：文档版本、中文 CTA、P0/P1 唯一归属、路由、支付模型、技术基线和链接检查通过。
- 监控与回滚：范围变化通过 D-025 追踪；后续恢复行情中心或 CMS 必须重新移动至 P0 并补齐验收和契约。

### `docs-v0.3.1` - 2026-06-22

- 类型：Docs / Product / Design / Frontend
- 摘要：产品结构调整为“官网营销页 + 应用工作台 + 管理后台”分离架构；根路径 `/` 为官网首页，`/app` 为应用工作台，`/admin` 为独立管理后台；补充移动端导航规则；确定后端采用轻量 DDD + 模块化单体，不做微服务、复杂 CQRS 或 Event Sourcing。
- MVP 边界影响：不改变实盘禁令；官网仅负责品牌、信任、转化和风险教育，不承载实盘交易或完整应用操作。
- API / 数据 / 权限 / 风控影响：无新增 API；前端路由、信息架构、布局组件、移动端导航、后端分层规范和验收标准更新。
- 验证：需要在 E2E 中覆盖 `/` → `/app/strategies`、`/app` 移动端底部导航，以及 `/admin` 独立登录和管理路径；后端代码审查需确认 Controller 不包含策略、交易、模拟盘或风控核心逻辑。
- 监控与回滚：如三端路由引入问题，可回滚信息架构和前端路由配置；不得回退 MVP 实盘禁令。

### `docs-v0.3.0` - 2026-06-22

- 类型：Docs / Architecture / Product / Risk
- 摘要：关闭全部开发前置决策；确定 Node/pnpm/Next/Nest/Prisma/PostgreSQL 技术栈、CoinGecko 行情、会员价格配额、关闭在线支付、risk-v1、paper-engine-v1、AWS Singapore 部署和 MVP 成功指标。
- MVP 边界影响：在线支付明确不进入 v1.0；模拟仅支持 BTC/ETH/SOL USDT 现货 1x。
- API / 数据 / 权限 / 风控影响：所有列表统一服务端分页，用户默认 20、管理端默认 50、最大 100；新增精确风控、撮合、精度、保留和恢复要求。
- 验证：所有 Q 项关闭；分页、支付禁用、技术版本、风险/撮合参数、链接和文档一致性检查通过。
- 监控与回滚：技术依赖由锁文件固定；领域参数、tokens 和决策均版本化，变更必须新增 ADR/决策记录。

### `docs-v0.2.4` - 2026-06-22

- 类型：Docs / Design
- 摘要：完成 v0 设计系统剩余决策，包括系统字体与字号、4px 间距、圆角、阴影、控件/表格尺寸、内容宽度、五档断点、焦点、Lucide 图标风格和功能性动效。
- MVP 边界影响：无；高保真装饰与完整深色主题仍不进入 MVP。
- API / 数据 / 权限 / 风控影响：无；响应式布局继续保证风险、权限和状态信息完整。
- 验证：无未决 `Q-009` 引用，设计 token、断点、文档链接和验收规则检查通过。
- 监控与回滚：所有值均为 v0，可通过版本化 token 变更调整，不允许页面局部漂移。

### `docs-v0.2.3` - 2026-06-22

- 类型：Docs / Design
- 摘要：确定 13 个 v0 颜色 tokens、P0 组件开发顺序、WCAG 2.2 AA 组件状态要求及全页面自适应原则。
- MVP 边界影响：页面以结构、信息和一致性为优先，不要求最终高保真；禁止为视觉效果引入复杂动效、强渐变和高饱和色块。
- API / 数据 / 权限 / 风控影响：无；窄屏不得隐藏风险、权限和状态信息。
- 验证：token 值、组件清单、响应式验收、文档链接和旧版本引用检查通过。
- 监控与回滚：v0 tokens 可版本化调整；变更时同步视觉回归和对比度测试。

### `docs-v0.2.2` - 2026-06-22

- 类型：Docs / Design
- 摘要：MVP 默认主题从深色改为浅色；确立白/灰/黑的数据平台视觉、深灰/黑主操作、低频低饱和蓝、用户端轻卡片和管理端高密度表格方向。
- MVP 边界影响：深色主题仅预留语义 token，不进入第一版功能与测试范围。
- API / 数据 / 权限 / 风控影响：无；收益风险并列和数据语义色要求保持不变。
- 验证：旧深色颜色引用扫描、文档链接和视觉验收规则检查通过。
- 监控与回滚：视觉变化通过 token 和视觉回归管理；不得回退为页面级硬编码主题。

### `docs-v0.2.1` - 2026-06-22

- 类型：Docs / Security
- 摘要：用户端与管理端统一使用后端管理的邮箱一次性验证码登录，邮件由 Resend 投递；移除密码注册、登录和重置规格。
- MVP 边界影响：无。
- API / 数据 / 权限 / 风控影响：新增 OTP 请求/验证契约、challenge/session 数据模型、管理员预授权与会话 audience 隔离要求。
- 验证：文档链接、决策引用、认证术语和废弃密码流程扫描通过。
- 监控与回滚：Resend 投递监控不得改变认证结果；回滚需恢复认证决策、API、数据模型与测试规格。

### `docs-v0.2.0` - 2026-06-22

- 类型：Docs
- 摘要：重构文档体系以支持 Codex/Cursor 直接开发；建立事实来源、决策日志和 AI 工作流；统一会员属于 MVP、生产支付单独门禁的范围；修正 API 与数据模型边界。
- MVP 边界影响：不改变实盘禁令；明确会员权益与订阅生命周期为 P0。
- API / 数据 / 权限 / 风控影响：规格纠错，尚无应用迁移。
- 验证：文档链接、术语、禁用能力和范围一致性检查。
- 监控与回滚：当前目录非 Git 仓库；后续初始化版本控制后用提交回滚。

### `docs-v0.1.0` - 2026-06-22

- 类型：Docs
- 摘要：建立初始产品、设计、工程、API、数据库、风控、权限和测试文档。
- MVP 边界影响：确立不连接交易所、不读取真实资产、不真实下单。
