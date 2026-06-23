# QuantFlow API 规格

状态：设计基线｜实现后以版本化 OpenAPI + 契约测试为机器可读事实来源

## 1. 通用契约

- REST 基础路径：`/api/v1`；JSON 字段使用 `camelCase`，时间使用 UTC ISO 8601。
- ID 使用 UUID 字符串；decimal 在 JSON 中使用十进制字符串，禁止用 JSON number 传递资金与精度敏感值。
- 任何返回集合的列表端点都必须服务端分页；禁止返回无界业务数组。
- 所有 mutation 校验 `Content-Type`、输入 schema、权限和对象状态。创建资源、人工开通等可重试操作使用 `Idempotency-Key`。
- 用户可见 `message` 默认简体中文；日志使用稳定 `code`，不得返回堆栈、SQL、token 或内部密钥。
- 收益数据必须包含同周期 `maxDrawdown`、`riskLevel`、`sampleSize`、`dataSource` 和 `calculatedAt`。

成功响应：

```json
{
  "data": {},
  "meta": { "requestId": "uuid" }
}
```

列表响应：

```json
{
  "data": [],
  "meta": {
    "requestId": "uuid",
    "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
  }
}
```

### 1.1 全局分页规则

| 场景                | 默认 `pageSize` | 可选值        | UI                               |
| ------------------- | --------------: | ------------- | -------------------------------- |
| 用户端列表          |              20 | 10 / 20 / 50  | 编号分页，默认 20                |
| 管理端列表/表格     |              50 | 20 / 50 / 100 | 编号分页，默认 50                |
| 搜索建议/选择器批次 |              20 | 20            | “加载更多”批次，不属于页面主列表 |

通用参数：`page` 默认 1，必须为正整数；`pageSize` 必须来自当前端点允许值，硬上限 100；`sortBy` 使用白名单；`sortOrder=asc|desc`。筛选、搜索或排序变化后客户端重置到第 1 页。超过最后一页返回空 `data` 和真实 pagination，不自动跳页。

所有列表必须有稳定二级排序，通常为 `{sortField}, id`；时间倒序使用 `createdAt desc, id desc`。MVP 使用 offset/page 分页并返回 `total`、`totalPages`；数据量增长造成性能问题时另立 ADR 迁移 cursor，不在同一端点混用两套契约。

适用范围包括策略、信号、模拟盘、模拟持仓/订单/成交、风险事件、通知、安全事件、订阅、用户、管理员、角色、权限和审计日志。会员计划、支持币种等小型集合也返回 pagination；仅当 `total <= pageSize` 时 UI 可隐藏分页控件。

K 线、权益曲线等时间序列不是“列表页”，使用 `from/to/interval/limit` 范围查询，单次最多 1,000 点并允许下采样；不得伪装成 page 分页。

错误响应：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数有误",
    "fields": [{ "path": "initialBalance", "code": "GREATER_THAN_ZERO" }],
    "requestId": "uuid"
  }
}
```

## 2. 认证与当前用户

| 方法  | 路径                         | 鉴权            | 用途                                                                            |
| ----- | ---------------------------- | --------------- | ------------------------------------------------------------------------------- |
| POST  | `/auth/email-otp/request`    | 否              | 请求邮箱验证码；`portal=user/admin`，生产必传 `turnstile_token`，统一响应防枚举 |
| POST  | `/auth/email-otp/verify`     | 否              | 验证邮箱验证码并签发对应 audience 会话                                          |
| POST  | `/auth/refresh`              | Refresh session | 轮换会话                                                                        |
| POST  | `/auth/logout`               | 是              | 撤销当前会话                                                                    |
| GET   | `/me`                        | 是              | 资料、会员、权益、风险确认状态                                                  |
| PATCH | `/me/profile`                | 是              | 更新资料                                                                        |
| GET   | `/me/security-events`        | 是              | 当前用户安全事件；用户端分页                                                    |
| GET   | `/me/strategy-subscriptions` | 是              | “我的策略”列表；用户端分页，支持状态和策略筛选                                  |

MVP 不提供密码注册、密码登录和密码重置。Resend 只负责邮件投递，Cloudflare Turnstile 只负责请求挑战；验证码、后端限流与会话契约见 `../security/authentication.md`。

## 3. 策略与信号

| 方法   | 路径                                             | 用途                                                                                      |
| ------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| GET    | `/strategies`                                    | 公开/有权策略列表；支持 `symbol,type,riskLevel,period,maxDrawdownLte,access,paperEnabled` |
| GET    | `/strategies/{strategyId}`                       | 策略详情、当前版本、指标、数据来源、风险披露                                              |
| POST   | `/strategies/{strategyId}/subscriptions`         | 订阅信号；校验权益、状态和高风险确认                                                      |
| DELETE | `/strategies/{strategyId}/subscriptions/current` | 取消当前用户订阅                                                                          |
| PUT    | `/strategies/{strategyId}/favorite`              | 收藏，幂等，P1                                                                            |
| DELETE | `/strategies/{strategyId}/favorite`              | 取消收藏，P1                                                                              |
| GET    | `/signals`                                       | 当前用户有权信号列表；支持策略、币种、方向、生命周期和时间筛选                            |
| GET    | `/signals/{signalId}`                            | 信号详情、触发原因、有效期、风险和披露                                                    |
| PUT    | `/signals/{signalId}/favorite`                   | 收藏，幂等，P1                                                                            |
| DELETE | `/signals/{signalId}/favorite`                   | 取消收藏，P1                                                                              |
| PUT    | `/signals/{signalId}/reminder`                   | 设置提醒，P1                                                                              |
| DELETE | `/signals/{signalId}/reminder`                   | 移除提醒，P1                                                                              |

信号响应至少包含 `strategyId,symbol,direction,triggerPrice,currentPriceSnapshot,suggestedPositionPct,stopLossPrice,takeProfitPrice,generatedAt,validUntil,status,riskLevel`。收藏、提醒、是否已用于模拟是当前用户关系字段，不得写入全局信号 `status`。

## 4. 模拟盘

| 方法   | 路径                                      | 用途                                 |
| ------ | ----------------------------------------- | ------------------------------------ |
| GET    | `/paper-accounts`                         | 当前用户模拟盘列表                   |
| POST   | `/paper-accounts`                         | 创建模拟盘；校验权益、参数和风险确认 |
| GET    | `/paper-accounts/{accountId}`             | 详情、模拟权益、回撤、持仓、参数版本 |
| POST   | `/paper-accounts/{accountId}/pause`       | 暂停；状态机校验                     |
| POST   | `/paper-accounts/{accountId}/resume`      | 恢复；重新校验策略与行情状态         |
| POST   | `/paper-accounts/{accountId}/copies`      | 复制配置并创建新模拟盘               |
| DELETE | `/paper-accounts/{accountId}`             | 软删除已结束/暂停的模拟盘            |
| GET    | `/paper-accounts/{accountId}/positions`   | 模拟持仓                             |
| GET    | `/paper-accounts/{accountId}/orders`      | 模拟订单                             |
| GET    | `/paper-accounts/{accountId}/trades`      | 模拟成交                             |
| GET    | `/paper-accounts/{accountId}/performance` | 模拟权益与回撤序列                   |
| GET    | `/paper-accounts/{accountId}/risk-events` | 风险事件                             |

创建请求示例：

```json
{
  "strategyId": "uuid",
  "symbol": "BTCUSDT",
  "name": "BTC 趋势模拟盘",
  "initialBalance": "10000.00",
  "maxPositionPct": "0.10",
  "maxPositions": 3,
  "riskDisclosureVersion": "risk-v1",
  "riskAccepted": true
}
```

服务端强制 `leverage=1`，且创建、查询和日志对象始终使用 `paper` 命名。撮合规则见 `../strategy/strategy-and-paper-trading-rules.md`。

## 5. 会员

| 方法 | 路径                                 | 用途                                                         |
| ---- | ------------------------------------ | ------------------------------------------------------------ |
| GET  | `/membership/plans`                  | 计划与功能权益；用户端分页，不包含收益承诺                   |
| GET  | `/membership/subscription`           | 当前订阅与有效权益                                           |
| POST | `/integrations/email/resend/webhook` | 可选投递事件回调；验签、幂等，只更新投递监控，不改变认证结果 |

MVP 不注册用户购买、支付状态或支付 webhook 路由。会员由管理端人工/邀请码/测试开通；未来支付必须新增 ADR 和独立契约。

## 6. 通知与行情

| 方法      | 路径                               | 用途                         |
| --------- | ---------------------------------- | ---------------------------- |
| GET       | `/notifications`                   | 当前用户通知；用户端分页     |
| PATCH     | `/notifications/{notificationId}`  | 标记已读                     |
| GET/PATCH | `/notification-preferences`        | 通知偏好                     |
| GET       | `/market/symbols`                  | 支持币种与行情状态           |
| GET       | `/market/symbols/{symbol}`         | 快照、来源和采集时间         |
| GET       | `/market/symbols/{symbol}/candles` | K 线；必须返回来源与时间范围 |

行情超过允许延迟时必须返回 `isStale=true` 和 `capturedAt`，模拟执行按领域规则拒绝或暂停。

## 7. 管理端

管理端路径统一为 `/api/v1/admin`。所有接口要求管理员会话、资源级 RBAC；mutation 必须包含 `reason`，并在同一事务或可靠 outbox 中写审计记录。

| 资源           | 查询                                     | 允许的 mutation                                               |
| -------------- | ---------------------------------------- | ------------------------------------------------------------- |
| Dashboard      | `/dashboard`                             | 无                                                            |
| Users          | `/users`, `/users/{id}`                  | status、membership                                            |
| Strategies     | `/strategies`, `/{id}`                   | create、update、submit-review、approve、reject、pause、delist |
| Signals        | `/signals`, `/{id}`                      | cancel、mark-abnormal、repush                                 |
| Paper accounts | `/paper-accounts`, `/{id}`               | pause、resume、mark-abnormal                                  |
| Membership     | `/subscriptions`                         | manual-grant、extend、cancel；不包含支付和退款                |
| Risk           | `/risk-events`, `/{id}`                  | assign、resolve、ignore、escalate                             |
| Access         | `/roles`, `/permissions`, `/admin-users` | 角色与授权变更                                                |
| Audit          | `/audit-logs`                            | 只读                                                          |

具体角色权限以 `../security/roles-and-permissions.md` 为准。

## 8. 错误码与 HTTP 状态

| Code                          | HTTP | 含义                   |
| ----------------------------- | ---- | ---------------------- |
| `UNAUTHENTICATED`             | 401  | 未认证或会话失效       |
| `FORBIDDEN`                   | 403  | 无资源权限             |
| `ENTITLEMENT_REQUIRED`        | 403  | 会员权益不足           |
| `RISK_CONFIRMATION_REQUIRED`  | 409  | 需确认指定版本风险披露 |
| `RESOURCE_NOT_FOUND`          | 404  | 对象不存在或不可见     |
| `INVALID_STATE`               | 409  | 对象状态不允许操作     |
| `SIGNAL_EXPIRED`              | 409  | 信号已失效             |
| `PAPER_ACCOUNT_LIMIT_REACHED` | 409  | 模拟盘配额已满         |
| `MARKET_DATA_STALE`           | 503  | 行情不满足模拟条件     |
| `FEATURE_NOT_AVAILABLE`       | 404  | 当前部署未开放能力     |
| `VALIDATION_ERROR`            | 422  | 输入校验失败           |
| `RATE_LIMITED`                | 429  | 超出频率限制           |
| `INTERNAL_ERROR`              | 500  | 未分类服务端错误       |

## 9. 禁止的公开契约

MVP 不注册也不写入 OpenAPI：`exchange-connections`、`exchange-api-keys`、`real-orders`、`real-trades`、`real-positions`、`trade-confirmations`、`automation-rules`。未知路由返回 404，不能以“预留 API”为理由建立可执行控制器。
