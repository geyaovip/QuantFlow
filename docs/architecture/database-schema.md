# QuantFlow 数据模型

状态：逻辑模型基线｜实现后以迁移文件为结构事实来源

## 1. 全局约束

- PostgreSQL；主键 UUID，时间 `timestamptz`，JSON 仅用于非查询核心的快照/扩展字段。
- 价格、数量、金额和费用使用 `numeric(28,8)`，比例使用 `numeric(18,8)`；计算采用 decimal `ROUND_HALF_UP`。
- 业务表包含 `created_at`、`updated_at`；软删除对象包含 `deleted_at`。
- 生命周期状态与用户关系分开建模；例如收藏不是信号状态，会员 tier 不直接替代有效订阅。
- 模拟盘表只能引用 `paper_*` 对象，不与未来实盘表共享执行路径。
- 管理敏感变更必须有追加式审计日志。

## 2. 枚举

| 枚举                   | 值                                                                      |
| ---------------------- | ----------------------------------------------------------------------- |
| `user_status`          | `active`, `disabled`, `risk_watch`, `deleting`                          |
| `membership_tier`      | `free`, `pro`, `premium`                                                |
| `subscription_status`  | `pending`, `active`, `expired`, `cancelled`                             |
| `strategy_status`      | `draft`, `pending_review`, `active`, `paused`, `risk_watch`, `delisted` |
| `signal_status`        | `active`, `expired`, `cancelled`, `strategy_paused`, `risk_blocked`     |
| `risk_level`           | `low`, `medium`, `high`, `critical`                                     |
| `paper_account_status` | `running`, `paused`, `ended`, `data_error`, `strategy_paused`           |
| `paper_order_status`   | `pending`, `filled`, `cancelled`, `rejected`                            |
| `risk_event_status`    | `pending`, `processing`, `resolved`, `ignored`, `escalated`             |

状态转换由领域服务定义并测试，不允许任意字符串更新。

## 3. 用户与授权

| 表                      | 关键字段与约束                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `users`                 | `email_normalized` unique、`email`、`status`、`last_login_at`；MVP 不保存密码 hash，不冗余保存最终权益  |
| `user_profiles`         | `user_id` unique FK、`nickname`、`avatar_url`、`locale=zh-CN`、`timezone`                               |
| `user_risk_acceptances` | `user_id` FK、`disclosure_version`、`context`、`accepted_at`；unique(user, version, context)            |
| `user_security_events`  | `user_id` nullable、`event_type`、IP、UA、`occurred_at`；追加式                                         |
| `auth_email_challenges` | email hash/normalized email、`portal`、code hash、过期/使用时间、失败次数、请求 IP；短期保存并定期清理  |
| `auth_sessions`         | subject type/id、`audience`、session token hash、`expires_at`、`revoked_at`；用户与管理员 audience 隔离 |

## 4. 策略与信号

| 表                            | 关键字段与约束                                                                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strategies`                  | `slug` unique、名称/摘要、类型、`risk_level`、`status`、`required_tier`、`supports_paper_trading`、发布/删除时间                                                                                                                  |
| `strategy_symbols`            | `strategy_id`、`symbol_id`；unique(strategy, symbol)                                                                                                                                                                              |
| `strategy_versions`           | `strategy_id`、递增 `version`、逻辑、适合/不适合行情、仓位/止损/止盈/失效说明、创建人；unique(strategy, version)                                                                                                                  |
| `strategy_metrics`            | `strategy_id`、`strategy_version_id`、`period`、return、max drawdown、win rate、P/L ratio、trade count、consecutive losses、sample size、data source、calculated_at；unique(strategy_version, period, data_source, calculated_at) |
| `strategy_signals`            | `strategy_id`、`strategy_version_id`、symbol、direction、触发/快照/止损/止盈价格、建议仓位、原因、风险、状态、生成/失效时间                                                                                                       |
| `strategy_signal_events`      | `signal_id`、event type、payload、occurred_at；追加式生命周期日志                                                                                                                                                                 |
| `user_strategy_subscriptions` | `user_id`、`strategy_id`、状态、订阅/取消时间；一个用户每策略最多一个 active                                                                                                                                                      |
| `user_strategy_favorites`     | unique(user, strategy)，P1                                                                                                                                                                                                        |
| `user_signal_favorites`       | unique(user, signal)，P1                                                                                                                                                                                                          |
| `user_signal_reminders`       | unique(user, signal)、渠道、计划时间、发送状态，P1                                                                                                                                                                                |

## 5. 行情

| 表                       | 关键字段与约束                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `market_symbols`         | `symbol` unique、base、quote、状态、价格/数量精度                                          |
| `market_price_snapshots` | symbol FK、price、volume、change、source、captured_at；按时间分区候选                      |
| `market_candles`         | symbol FK、interval、open time、OHLCV、source；unique(symbol, interval, open_time, source) |

行情使用 CoinGecko adapter：分钟快照保留 90 天、5 分钟 K 线 180 天、1 小时与 1 日 K 线 2 年；按月分区并由清理任务执行保留策略。

## 6. 模拟盘

| 表                         | 关键字段与约束                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `paper_accounts`           | user/strategy/version/symbol FK、名称、初始/现金/当前权益、仓位上限、最大持仓、`leverage=1` check、status、参数版本、开始/暂停/结束/删除时间 |
| `paper_positions`          | account FK、symbol、side、quantity、均价、mark、未实现 PnL、status；活动持仓唯一约束按领域确定                                               |
| `paper_orders`             | account/signal FK、side、type、price、quantity、status、拒绝原因、参数快照                                                                   |
| `paper_trades`             | account/order FK、price、quantity、估算手续费、已实现 PnL、成交时间                                                                          |
| `paper_performance_points` | account FK、equity、return rate、drawdown、position count、recorded_at；unique(account, recorded_at)                                         |
| `paper_risk_events`        | account FK、type、risk level、message、payload、occurred_at                                                                                  |

模拟订单成交时，订单、持仓、成交、账户权益和 outbox 事件必须在同一事务中提交。删除模拟盘默认软删除，不删除审计和历史表现。

## 7. 会员与通知

| 表                         | 关键字段与约束                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `membership_plans`         | tier unique、名称、参考月/年价、CNY、状态、展示顺序；MVP 不创建线上支付价格 ID                                          |
| `membership_entitlements`  | plan FK、`key`、typed value；unique(plan, key)                                                                          |
| `user_subscriptions`       | user/plan FK、status、source(`manual/invite/test`)、周期起止、取消时间、`granted_by_admin_id` nullable、reason nullable |
| `user_notifications`       | user FK、type、title、content、read_at、created_at                                                                      |
| `notification_preferences` | user/channel/type、enabled；unique(user, channel, type)                                                                 |
| `system_announcements`     | title、content、status、发布/结束时间                                                                                   |

有效权益由有效订阅 + 计划权益计算，Free 作为默认计划或代码策略统一实现，不从 `users.membership_tier` 推断付费状态。MVP migration 不创建 payments 或 payment webhook 表；未来在线支付另立 ADR 和迁移。

## 8. 管理端、风险与可靠事件

| 表                       | 关键字段与约束                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `admin_users`            | `email_normalized` unique、email、status、last_login_at；仅预先授权账号可登录，不保存密码 hash          |
| `admin_roles`            | name unique、description                                                                                |
| `admin_permissions`      | `resource`、`action` unique pair                                                                        |
| `admin_user_roles`       | unique(admin_user, role)                                                                                |
| `admin_role_permissions` | unique(role, permission)                                                                                |
| `admin_audit_logs`       | actor、action、resource type/id、reason、before/after、IP、UA、request id、created_at；追加式           |
| `risk_events`            | type、level、关联 user/strategy/signal/paper account、status、message、assignee、handled_at、resolution |
| `outbox_events`          | aggregate、event type、payload、occurred/published time、attempts；用于事务后可靠异步处理               |

## 9. 索引与删除策略

- 所有 FK 建索引；列表索引依据 API 的真实查询与 `EXPLAIN` 添加，避免无依据的组合索引。
- 所有分页列表必须有稳定排序索引，通常为筛选字段 + 排序字段 + `id`；禁止在无索引高基数结果上做生产分页。
- 至少覆盖 signals(strategy/status/generated_at)、paper accounts(user/status)、performance(account/recorded_at)、risk(status/level/created_at)、audit(actor/created_at)。
- 审计、安全和模拟交易历史不做级联物理删除；用户删除采用匿名化，业务数据保留 2 年后再评估清理。

## 10. MVP 禁止模型

MVP 迁移中不得创建或接收 `exchange_api_keys`，也不得创建可写入的真实订单、真实成交、真实持仓或自动化规则表。未来架构只保留在规划文档，不进入当前 migration graph。
