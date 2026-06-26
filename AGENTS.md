# QuantFlow Agent Instructions

本文件是仓库内 AI Agent 和贡献者的最高优先级执行规则。显式用户指令和平台规则优先于本文件；其余文档冲突时按本文“事实来源”与 `docs/README.md` 的冲突处理顺序执行。

## 1. 开始任务

1. 读 `docs/dev/task-router.md` 定位任务类型、必改目录和验收命令。
2. 读 `docs/project/implementation-status.md` 确认现状；**不要依据规格文档假设功能已实现**。
3. 只读任务相关事实来源，不要把整个 `docs/` 注入上下文。
4. 检查现有代码、迁移和测试，再动手改。
5. 新供应商、价格、配额或风控选择必须先写入 `docs/project/decision-log.md`。
6. 只修改完成任务所需内容，保留用户已有改动。

### 事实来源

| 主题                   | 文档                                                                              |
| ---------------------- | --------------------------------------------------------------------------------- |
| 长期原则与发布红线     | `constitution.md`                                                                 |
| 当前实现进度           | `docs/project/implementation-status.md`                                           |
| 任务路由               | `docs/dev/task-router.md`                                                         |
| MVP 范围、优先级与版本 | `docs/project/mvp-scope-and-roadmap.md`                                           |
| 已决与待决事项         | `docs/project/decision-log.md`                                                    |
| 页面与用户路径         | `docs/product/information-architecture.md`                                        |
| 领域规则               | `docs/strategy/strategy-and-paper-trading-rules.md`                               |
| 风控与文案             | `docs/risk/risk-control-rules.md`                                                 |
| HTTP 契约              | `docs/api/api-spec.md`；运行时以 `packages/contracts` 与 API 测试为准             |
| 持久化模型             | `docs/architecture/database-schema.md`；运行时以 Prisma schema 与 migrations 为准 |
| 权限                   | `docs/security/roles-and-permissions.md`                                          |
| 登录与邮件             | `docs/security/authentication.md`                                                 |
| 技术栈与行情           | `docs/dev/technical-baseline.md`                                                  |
| 部署                   | `docs/dev/deployment.md`                                                          |
| 会员价格与配额         | `docs/product/membership-plans.md`                                                |
| 完成标准               | `docs/testing/acceptance-criteria.md`                                             |

## 2. MVP 边界（摘要）

完整定义见 `constitution.md` 与 `docs/project/mvp-scope-and-roadmap.md`；三端路径与导航见 `docs/product/information-architecture.md`。

- 产品结构：`/` 官网、`/app` 应用工作台、`/admin` 管理后台。
- MVP 是策略信号、会员权益与模拟盘产品，**不是**实盘交易产品。
- 禁止：交易所连接、真实资产/订单、半自动或全自动交易、任何实盘入口。
- 以下交易相关开关必须保持 `false`：`enableExchangeConnection`、`enableSemiAutoTrading`、`enableAutoTrading`、`enableAuthorPortal`。
- `enableProductionPayments` 可由生产环境变量开启，仅用于 Plisio 会员支付，不得引入实盘交易、交易所连接或收益承诺。
- 前端隐藏不是安全边界；后端、权限、配置和测试必须同时阻断。

## 3. 产品与合规（摘要）

完整原则见 `constitution.md`；视觉与文案见 `docs/design/ui-guidelines.md`。

- 品牌名 `QuantFlow`；用户可见内容默认简体中文。
- 收益必须同屏展示同周期最大回撤；胜率必须带交易次数和盈亏比。
- 模拟对象必须标注“模拟”；会员只卖权限与容量，不卖预期收益。
- 策略详情、信号详情、创建模拟盘确认、会员开通确认必须包含标准风险披露（全文见 `constitution.md`）。

## 4. 工程约束

- TypeScript strict；边界输入必须校验。
- 后端：轻量 DDD + 模块化单体；核心模块分 `domain` / `application` / `infrastructure` / `interfaces`。
- 禁止微服务、复杂 CQRS、Event Sourcing、复杂事件总线。
- Controller 只处理请求响应；Use Case 编排；Domain 持有规则；Repository 访问数据。
- 交易、策略、模拟盘、风控逻辑不得写在 Controller 中。
- 列表一律服务端分页：用户默认 20、管理端默认 50、最大 100；禁止无限滚动。
- 金额、价格、数量、费用、比例使用 decimal 语义，禁止浮点作为业务最终口径。
- 权益、状态、风控、RBAC 必须在服务端校验；敏感管理操作写审计日志。
- 登录：后端管理邮箱 OTP，Resend 仅负责投递。
- 单文件默认不超过 300 行、函数不超过 60 行、嵌套不超过 3 层；见 `docs/dev/code-organization-guidelines.md`。

## 5. 变更与完成标准

- 范围、API、数据库、权限、风控或计算口径变更时，只更新**拥有该定义**的文档；禁止把同一规则复制到多份文档。
- 可运行行为变化后，同步更新 `docs/project/implementation-status.md`。
- 完成任务前：运行与改动相称的 test / typecheck / lint / `check-docs`；检查无实盘入口、收益风险配对、模拟标识、服务端权限和审计。
- 报告：修改文件、验证命令与结果、剩余风险、待用户决策项。

详细流程见 `docs/dev/ai-development-workflow.md`。
