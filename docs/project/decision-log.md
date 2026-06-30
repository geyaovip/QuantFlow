# QuantFlow 决策日志

本文件记录改变实现方向的正式决定。当前开发前置决策已全部关闭；新问题必须先记录再实施。

## 已决定

列说明：

- **状态**：`closed` 已关闭，按结果执行；`superseded` 已被新决策替代。
- **Agent**：`follow` 必须遵守；`propose-only` 不得自行推翻，需新 ADR。

| ID    | 状态       | Agent        | 决策                 | 结果                                                                                                                        | 影响                                                                                                    |
| ----- | ---------- | ------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| D-001 | closed     | follow       | MVP 产品边界         | 策略信号、模拟盘、会员权益与订阅、通知、个人中心、管理后台                                                                  | 禁止任何实盘交易链路                                                                                    |
| D-002 | closed     | follow       | 默认语言             | 简体中文，品牌名保持 QuantFlow                                                                                              | 文案集中管理，预留 i18n                                                                                 |
| D-003 | closed     | follow       | 策略来源             | MVP 仅平台管理员创建和审核                                                                                                  | `enableAuthorPortal=false`                                                                              |
| D-004 | closed     | follow       | 合约与杠杆           | 仅展示信号/模拟数据；模拟只做现货 1 倍                                                                                      | 不提供真实合约下单或模拟做空                                                                            |
| D-005 | closed     | follow       | 会员边界             | MVP 实现权益和订阅生命周期                                                                                                  | 生产在线支付由 D-016 明确关闭                                                                           |
| D-006 | closed     | follow       | 实时更新             | MVP 使用轮询；协议允许以后替换 SSE/WebSocket                                                                                | 不把实时协议写入领域层                                                                                  |
| D-007 | closed     | follow       | 架构形态             | 模块化单体                                                                                                                  | 不提前拆微服务                                                                                          |
| D-008 | closed     | follow       | 登录                 | 用户端与管理端统一邮箱 OTP，Resend 发送                                                                                     | 后端管理验证码/会话；管理员预授权                                                                       |
| D-009 | closed     | follow       | MVP UI               | 默认浅色，参考专业数据平台但不复制                                                                                          | 白灰黑、深色主操作、低频蓝；深色后置                                                                    |
| D-010 | closed     | follow       | v0 tokens 与组件顺序 | 采用 UI 规范 tokens；先基础/通用组件，再组装页面                                                                            | 页面不得绕过组件和 tokens                                                                               |
| D-011 | closed     | follow       | 响应式               | 所有页面随可用宽度自适应                                                                                                    | 不隐藏关键风险、权限或状态信息                                                                          |
| D-012 | closed     | follow       | 排版与交互           | 系统字体、4px 间距、克制圆角/阴影、五档断点、短动效、Lucide 风格                                                            | 详见 `design/ui-guidelines.md`                                                                          |
| D-013 | closed     | follow       | 技术栈（Q-001）      | Node 24、pnpm 11、Next 16/React 19、Nest 11、Prisma 7、PostgreSQL 18                                                        | 详见 `dev/technical-baseline.md`                                                                        |
| D-014 | closed     | follow       | 行情数据（Q-002）    | CoinGecko；60 秒采集、120 秒 stale、5 分钟暂停；BTC/ETH/SOL USDT                                                            | 供应商隔离在 adapter                                                                                    |
| D-015 | superseded | follow       | 会员计划（Q-003）    | Free/Pro/Premium 价格和配额按会员计划文档                                                                                   | 已被 D-030 替代                                                                                         |
| D-016 | superseded | follow       | 支付（Q-004）        | MVP 不启用在线支付，CNY 仅为参考价格；人工/邀请码/测试开通                                                                  | 已被 D-028 替代                                                                                         |
| D-017 | closed     | follow       | 风控阈值（Q-005）    | 采用风控文档的样本、回撤、连亏和行情延迟阈值                                                                                | 自动动作可审计、可回滚                                                                                  |
| D-018 | closed     | follow       | 模拟撮合（Q-006）    | 下一有效快照、10bps 手续费、5/10bps 滑点、decimal half-up、现货 1x                                                          | 参数版本化，详见策略规则                                                                                |
| D-019 | superseded | propose-only | 部署（Q-008）        | AWS Singapore：ECS Fargate、RDS PostgreSQL 18、S3/CloudFront、CloudWatch/Sentry                                             | 已被 D-027 替代                                                                                         |
| D-020 | closed     | follow       | 全局分页             | 所有列表服务端分页；用户默认 20、管理端默认 50，最大 100                                                                    | MVP 不使用无限滚动                                                                                      |
| D-021 | closed     | follow       | MVP 初始成功指标     | 使用路线文档的转化、留存、质量、行情和风险响应目标                                                                          | 上线后连续观测 30 天再版本化调整                                                                        |
| D-022 | closed     | follow       | 产品入口结构         | `/` 官网营销页、`/app` 应用工作台、`/admin` 独立管理后台；官网主 CTA 为“进入应用”                                           | `/app` 必须重定向 `/app/strategies`，应用桌面端使用顶部导航                                             |
| D-023 | closed     | follow       | 移动端导航           | 官网可用汉堡菜单；`/app` 使用四项底部导航；`/admin` 桌面优先但移动端保留必要操作                                            | 不允许用“仅查看”规避全页面自适应要求                                                                    |
| D-024 | closed     | follow       | 后端架构风格         | 轻量 DDD + 模块化单体；核心模块分 domain/application/infrastructure/interfaces；不做微服务、复杂 CQRS、Event Sourcing       | 更新后端规范、代码组织、技术基线和验收                                                                  |
| D-025 | closed     | follow       | P0 范围校正          | 行情中心和后台内容管理移至 P1                                                                                               | MVP 继续保留 Market Data 支撑服务，官网内容由代码/配置维护                                              |
| D-026 | closed     | follow       | 品牌资源体系         | 只保留平滑且光学居中的正式母版，由其派生 favicon、PWA、浅/深色图形及用户端/管理端组合标识                                   | 删除旧锯齿母版和重复中间资源；界面优先用图形 SVG + HTML 品牌文字；深色版本不代表启用深色主题            |
| D-027 | closed     | follow       | 生产部署替代 D-019   | 复用现有 Ubuntu VPS，QuantFlow 使用独立 Docker Compose project；Cloudflare Tunnel/DNS/TLS/WAF/Turnstile 提供边缘与安全能力  | 不再使用 AWS ECS/RDS/S3/CloudFront；应用只绑定 loopback，数据库无公网端口；异地对象存储备份见 D-029     |
| D-028 | superseded | follow       | 生产会员支付         | 会员 Pro/Premium 使用 Plisio 加密支付；仅允许 Tether BEP-20 (`USDT_BSC`) 与 Tether ERC-20 (`USDT`)；商户承担佣金            | 已被 D-030 替代                                                                                         |
| D-029 | closed     | follow       | 数据库异地备份       | MVP 不做 Cloudflare R2 或其他对象存储异地备份；仅在 VPS 本地保留 `pg_dump` 全量与 WAL 归档，按 `deployment.md` 执行恢复演练 | 移除 R2 相关脚本、env 与部署 secret；不承诺跨机房 RPO/RTO                                               |
| D-030 | closed     | follow       | 会员计划与美元支付   | 付费档位改为 Plus/Pro；Plus 为 $4.90/月、$49/年，Pro 为 $9.90/月、$99/年；Plisio 以 USD source amount 创建 USDT invoice     | 旧 Pro 前滚映射为 Plus，旧 Premium 前滚映射为 Pro；仅开通会员容量，不引入交易所连接、真实下单或收益承诺 |

## 待决策

当前无待决策项。

## 新增决策格式

```text
| D-XXX | open/closed/superseded | follow/propose-only | 问题 | 决策结果 | 影响范围 |
```

变更已有决定时保留旧记录，新增替代决定并注明日期、原因和被替代 ID；同步事实来源与验收标准。
