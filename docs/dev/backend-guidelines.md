# QuantFlow 后端开发规范

状态：架构基线｜技术栈已确定，版本以 `technical-baseline.md` 为准

## 目录

1. 文档目标
2. 技术栈
3. 后端架构原则
4. 业务领域模块
5. 轻量 DDD 分层
6. 代码组织与质量约束
7. 数据与事务规范
8. 权限与鉴权
9. 风控与审计
10. 异步任务与实时能力
11. 安全与性能
12. 验收标准

## 1. 文档目标

本文档定义 QuantFlow MVP 后端开发规范，确保服务边界、数据模型、权限、风控和审计能力满足后续扩展。

QuantFlow MVP 后端不得开放真实交易所 API 连接、真实资产读取、真实下单、半自动交易或全自动交易接口。未来能力只能记录在路线或 ADR；不得进入当前模块、迁移或公开契约。

## 2. 技术栈

1. Node.js 24 LTS、NestJS 11.1 模块化单体和 standalone worker。
2. Prisma 7.8 + PostgreSQL 18。
3. PostgreSQL outbox + worker 轮询；MVP 不引入 Redis、RabbitMQ 或微服务。
4. 客户端先轮询；领域事件不绑定 WebSocket/SSE。
5. Docker Compose、OpenAPI、自有 Ubuntu VPS、Cloudflare Tunnel；完整基线见 `technical-baseline.md` 和 `deployment.md`。

## 3. 后端架构原则

QuantFlow 后端采用轻量 DDD 思想和模块化单体架构。

必须遵守：

1. 使用模块化单体架构。
2. 按业务领域拆分模块，而不是按技术层随意堆 service。
3. 核心业务模块区分 `domain`、`application`、`infrastructure`、`interfaces` 层。
4. 简单模块可以适度简化，不为 CRUD 或薄封装做过度抽象。
5. 不使用微服务。
6. 不使用复杂 CQRS。
7. 不使用 Event Sourcing。
8. 允许使用领域事件，例如 `StrategySignalGenerated`、`PaperOrderExecuted`、`RiskEventTriggered`。
9. 领域事件第一版可使用本地事件、PostgreSQL outbox 或 worker 队列实现，不引入复杂事件总线。
10. 任何交易、策略、模拟盘、风控逻辑不能直接写死在 Controller 里。

职责原则：

1. Controller 只负责请求响应、鉴权入口、DTO 校验和状态码。
2. Use Case / Application Service 负责编排流程、事务边界和跨领域协作。
3. Domain 负责核心规则、状态转换、领域校验和领域事件产生。
4. Repository 负责数据访问，不承载业务规则。
5. Infrastructure 负责数据库、行情、邮件、外部 adapter 和 outbox。

## 4. 业务领域模块

MVP 重点领域：

1. Strategy：策略、版本、指标、审核。
2. Signal：策略信号、信号日志、推送状态。
3. Paper Trading：模拟账户、模拟订单、模拟持仓、模拟交易。
4. Risk：风险事件、风控规则、异常处理。
5. Subscription：会员计划、权益、人工/邀请码/测试订阅和 Plisio 支付订阅；支付只影响会员容量，不影响策略或交易能力。
6. User：用户资料、会员状态、风险测评。
7. Notification：站内通知、邮件、Telegram 预留。
8. Admin：管理端权限、审核、操作日志。

支撑模块：

1. Auth：邮箱验证码、Resend 邮件 adapter、会话创建/轮换/撤销和安全事件。
2. Market Data：行情、K 线、价格快照。

未来能力边界：

MVP 不创建 Exchange Connection、真实 Order Execution 或 Automation 模块。未来阶段只能在重新评审后新增独立模块，不得复用模拟盘执行服务。

## 5. 轻量 DDD 分层

核心业务模块建议结构：

```text
modules/
  strategy/
    domain/
      entities/
      value-objects/
      services/
      events/
    application/
      use-cases/
      dto/
    infrastructure/
      repositories/
      adapters/
    interfaces/
      http/
```

分层说明：

1. `domain`：实体、值对象、领域服务、领域事件和核心规则。
2. `application`：Use Case、流程编排、事务边界、DTO 和权限前置协作。
3. `infrastructure`：Repository 实现、外部 adapter、Prisma、Resend、CoinGecko、outbox。
4. `interfaces`：HTTP Controller、请求响应 DTO、OpenAPI 装饰器。

规则：

1. Controller 不写业务逻辑。
2. Domain 不依赖 HTTP、Prisma、Nest request 或外部 adapter。
3. Application 可以协调 Repository、Domain Service、权限、事务和领域事件发布。
4. Infrastructure 依赖外部技术，但业务规则不得沉入 adapter 或 repository。
5. 外部服务必须通过 Adapter 封装。
6. 所有管理端敏感操作必须写审计日志。
7. 简单模块可以合并少量层级，但不得把核心业务规则写入 Controller。

## 6. 代码组织与质量约束

详细规则以 `docs/dev/code-organization-guidelines.md` 为准。

后端必须遵守：

1. 单个源码文件建议不超过 300 行，超过 400 行必须拆分。
2. Controller 文件建议不超过 200 行。
3. Service 文件建议不超过 300 行。
4. 单个函数建议不超过 60 行。
5. Controller 只处理路由、鉴权、DTO 校验和响应状态。
6. Use Case / Application Service 编排用例，Domain 承载核心业务规则。
7. Repository 只负责数据访问，不做权限和业务判断。
8. 风控、会员权益、策略状态、信号状态和模拟盘拦截规则必须在后端独立实现并测试。

必须拆分的情况：

1. 一个 Service 同时处理多个业务域。
2. 一个函数同时处理权限、数据库事务、外部调用和响应拼装。
3. Controller 中出现复杂条件、循环或业务规则。
4. 同一状态判断、会员权益判断或风控规则复制 3 次以上。
5. 未来真实交易预留逻辑与 MVP 模拟盘逻辑混在同一执行链路中。

## 7. 数据与事务规范

### 7.1 数据规则

1. 主键使用 UUID。
2. 所有业务表包含 `created_at`、`updated_at`。
3. 重要状态表包含 `status` 和状态变更时间。
4. 金额、价格、比例使用 decimal，不使用 float。
5. 枚举值在代码和数据库中统一定义。

### 7.2 事务规则

必须使用事务的场景：

1. 创建模拟盘并初始化权益。
2. 模拟订单成交并更新持仓、权益、交易记录。
3. 人工/邀请码/测试订阅激活并开通权益。
4. 策略状态变更并记录审核日志。
5. 风险事件处理并修改关联对象状态。

## 8. 权限与鉴权

### 8.1 用户鉴权

1. 用户端和管理端统一使用邮箱一次性验证码，Resend 仅作为邮件 adapter。
2. 验证码只保存 hash，必须单次使用、限时、限次并防账号枚举。
3. 用户与管理员会话 audience、Cookie 和 guard 分离，使用服务端可撤销会话。
4. Resend API Key 和验证码不得发送给客户端或写入日志。

### 8.2 权益鉴权

必须校验：

1. 策略是否免费。
2. 用户会员等级是否满足。
3. 信号是否实时可见。
4. 模拟盘数量是否超限。
5. 历史数据范围是否超出权益。

### 8.3 管理端鉴权

1. 使用 RBAC。
2. 管理端接口独立权限 guard。
3. 超级管理员、运营、风控、客服和只读角色只授予必要权限；MVP 不创建财务角色。
4. 手动修改会员、暂停策略、取消信号必须记录审计日志。

## 9. 风控与审计

### 9.1 MVP 风控

1. 策略上线审核。
2. 高风险策略提示。
3. 数据样本不足提示。
4. 策略回撤过大事件。
5. 连续亏损事件。
6. 信号异常事件。
7. 模拟盘收益异常事件。
8. 行情数据延迟或异常事件。

### 9.2 风险提示

所有对外返回的策略详情、信号详情、模拟盘创建确认、会员申请/开通确认均应包含或关联免责声明：

QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。

### 9.3 审计日志

记录字段：

1. 操作人。
2. 操作对象。
3. 操作类型。
4. 操作前数据。
5. 操作后数据。
6. IP。
7. User-Agent。
8. 时间。

## 10. 异步任务与实时能力

### 10.1 异步任务

任务类型：

1. 行情数据同步。
2. 策略指标计算。
3. 信号生成。
4. 模拟盘撮合和权益计算。
5. 通知发送。
6. 风险事件检测。
7. 管理端看板聚合。

### 10.2 领域事件与实时能力

MVP 可先采用轮询，后续升级 WebSocket。领域事件第一版可以使用本地事件、PostgreSQL outbox 或 worker 轮询，不引入复杂事件总线。

实时事件：

1. `StrategySignalGenerated`：策略生成新信号。
2. `SignalExpired`：信号过期。
3. `PaperOrderExecuted`：模拟订单成交。
4. `RiskEventTriggered`：风险事件触发。
5. `NotificationCreated`：站内通知创建。

## 11. 安全与性能

### 11.1 安全

1. 参数校验使用 DTO 和 schema。
2. 防 SQL 注入，禁止拼接 SQL。
3. 富文本输出防 XSS。
4. 管理端接口启用更严格速率限制。
5. MVP 不注册支付路由，不接收真实交易所 API Key。

### 11.2 性能

1. 所有列表端点服务端分页：用户默认 20、管理端默认 50、最大 100；稳定排序并返回 total/totalPages。
2. 公开策略摘要和行情快照可使用进程内有界短 TTL 缓存；权限、权益、风控和审计不得依赖进程缓存。
3. 管理端看板使用预聚合。
4. MVP 时序数据使用 PostgreSQL 原生按月分区，不引入 TimescaleDB。
5. 信号推送延迟目标尽量控制在 10 秒内。
6. 模拟盘数据更新延迟控制在 1 分钟内。

## 12. 验收标准

1. 后端采用轻量 DDD + 模块化单体，不使用微服务、复杂 CQRS 或 Event Sourcing。
2. 后端模块覆盖 Strategy、Signal、Paper Trading、Risk、Subscription、User、Notification、Admin，并包含 Auth、Market Data 支撑模块。
3. MVP 生产环境无真实交易所 API 连接、真实资产读取、真实下单、半自动交易和全自动交易接口。
4. Controller 不包含交易、策略、模拟盘或风控核心逻辑。
5. Use Case 负责编排流程，Domain 负责核心规则，Repository 负责数据访问。
6. 权限、会员权益、策略状态、信号状态和模拟盘状态均在后端强校验。
7. 风控事件和管理员敏感操作均有审计日志。
8. 所有收益数据接口返回配套风险指标或风险提示引用。
