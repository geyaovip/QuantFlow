# QuantFlow Agent Instructions

本文件是仓库内 AI Agent 和贡献者的最高优先级执行规则。显式用户指令和平台规则优先于本文件；其余文档冲突时按本文的“事实来源”处理。

## 1. 开始任务

1. 先读与任务直接相关的文档，不要把整个 `docs/` 注入上下文。
2. 检查当前文件、测试和配置，不依据规划文档假设代码已存在。
3. 在修改前说明范围；新出现的供应商、价格、配额或风控选择必须先写入决策日志。
4. 只修改完成任务所需内容，保留用户已有改动。

事实来源：

| 主题                    | 文档                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| 产品原则与红线          | `constitution.md`                                                                                        |
| MVP 范围、优先级与版本  | `docs/project/mvp-scope-and-roadmap.md`                                                                  |
| 未决业务选择            | `docs/project/decision-log.md`                                                                           |
| 页面与用户路径          | `docs/product/information-architecture.md`                                                               |
| 领域规则                | `docs/strategy/strategy-and-paper-trading-rules.md`                                                      |
| 风控与文案              | `docs/risk/risk-control-rules.md`                                                                        |
| API / 数据库 / 权限     | `docs/api/api-spec.md`、`docs/architecture/database-schema.md`、`docs/security/roles-and-permissions.md` |
| 登录与邮件              | `docs/security/authentication.md`                                                                        |
| 技术栈与行情            | `docs/dev/technical-baseline.md`                                                                         |
| 部署、Cloudflare 与备份 | `docs/dev/deployment.md`                                                                                 |
| 会员价格与配额          | `docs/product/membership-plans.md`                                                                       |
| 完成标准                | `docs/testing/acceptance-criteria.md`                                                                    |

## 2. 不可突破的 MVP 边界

MVP 产品结构：`/` 官网营销页、`/app` 应用工作台、`/admin` 管理后台。

MVP 包含：官网首页、策略信号、策略广场、策略详情、信号中心、模拟盘、会员权益与订阅流程、通知、个人中心和管理后台。

路径职责：

- `/` 官网负责品牌、信任、转化和风险教育；右上角主 CTA 为“进入应用”。
- `/app` 应用工作台负责具体功能使用，包含策略广场、策略详情、信号中心、模拟盘、我的策略、会员订阅、个人中心；必须重定向到 `/app/strategies`，桌面端使用顶部导航。
- `/admin` 管理后台负责运营管理，包含数据看板、用户管理、策略管理、信号管理、模拟盘管理、会员管理、风险管理和权限审计。
- 官网和应用端共用基础 Design Tokens，但布局和信息密度可以不同。
- 官网移动端可以使用顶部导航 + 汉堡菜单；`/app` 移动端必须使用底部导航栏作为主导航，不使用左上角汉堡菜单；`/admin` 以桌面为主，但移动端仍需支持全部必要管理操作。
- `/app` 顶部区域用于页面标题、返回、通知、搜索等辅助操作；底部导航必须固定、简洁、易点击、适配安全区，且不得遮挡主操作按钮或风险提示。

MVP 禁止：

1. 真实交易所 API 连接或 API Key 提交。
2. 读取真实资产、真实持仓或真实订单。
3. 真实下单、半自动交易或全自动交易。
4. 暗示当前产品可以执行实盘交易的页面、按钮、接口或文案。

预留未来能力时必须与模拟盘执行路径物理分离、无公开路由、无用户入口，并保持以下开关为 `false`：

```text
enableExchangeConnection
enableSemiAutoTrading
enableAutoTrading
enableAuthorPortal
enableProductionPayments
```

前端隐藏不是安全边界；后端、权限、配置和测试必须同时阻断。

## 3. 产品语言与风险展示

- 品牌名始终为 `QuantFlow`，不使用中文品牌名。
- 用户端和管理端可见内容默认使用简体中文。
- 会员只销售访问权限、数据完整度、提醒和模拟盘容量，不销售预期收益。
- MVP 默认浅色主题：白/灰/黑为主，主按钮深灰或黑；低饱和蓝只用于链接、选中态和信息提示。深色只预留 token，不要求实现。
- 颜色使用 `docs/design/ui-guidelines.md` 的 v0 design tokens；所有页面必须自适应，不能通过隐藏关键风险或权限信息适配窄屏。
- 禁止“稳赚、保本、固定收益、零风险、必涨、100% 胜率、躺赚、永不爆仓”等表达。
- 展示收益率时必须同时展示同周期最大回撤；展示胜率时必须同时展示交易次数和盈亏比；排名必须带风险等级；回测必须带数据来源和样本提示。

需要完整风险披露的位置统一使用：

> QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。

策略详情、信号详情、创建模拟盘确认和会员申请/开通确认不得缺少该披露。

## 4. 工程约束

- TypeScript 开启 strict；边界输入必须校验。
- 后端采用轻量 DDD + 模块化单体；按 Strategy、Signal、Paper Trading、Risk、Subscription、User、Notification、Admin 等业务领域拆分模块。
- 核心业务模块区分 domain、application、infrastructure、interfaces；简单模块可以适度简化，不做重型 DDD。
- 不使用微服务、复杂 CQRS 或 Event Sourcing。
- 允许领域事件，如 StrategySignalGenerated、PaperOrderExecuted、RiskEventTriggered；第一版使用本地事件或 outbox/worker，不引入复杂事件总线。
- Controller 只负责请求响应；Use Case 负责编排流程；Domain 负责核心规则；Repository 负责数据访问。
- 任何交易、策略、模拟盘、风控逻辑不能直接写死在 Controller 里。
- 所有列表使用服务端分页：用户端默认 20 条，管理端默认 50 条，接口最大 100 条；MVP 不使用无限滚动。
- 价格、数量、金额、比例和费用使用 decimal 语义，禁止用二进制浮点作为最终业务口径。
- 权益、对象状态、风控和管理端 RBAC 必须由服务端校验。
- 管理员修改用户、会员、策略、信号、模拟盘、风险事件或权限时必须写审计日志。
- 用户端和管理端统一使用 Resend 投递邮箱验证码；Resend 不是认证服务，验证码和会话必须由后端安全管理。
- UI、请求、权限、格式化、领域规则和数据访问不得堆在同一文件。
- 默认文件不超过 300 行、函数不超过 60 行、嵌套不超过 3 层；明确例外见代码组织规范。

## 5. 变更与完成标准

范围、API、数据库、权限、风控或计算口径变更时，同步更新对应事实来源；不要在多个文档复制完整定义。

完成任务前必须：

1. 运行与改动相称的 test、typecheck、lint 或文档检查；若工程尚未初始化，明确说明无法运行。
2. 检查无实盘入口、收益与风险配对、模拟标识、服务端权限和审计要求。
3. 报告修改文件、验证结果、剩余风险和仍待用户决策的事项。

详细流程见 `docs/dev/ai-development-workflow.md`。
