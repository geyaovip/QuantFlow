# QuantFlow 文档索引

本目录保存开发规格与执行指引。文档基线为 `docs-v0.5.0`。**实现进度以 `project/implementation-status.md` 为准；可运行契约以代码、迁移和测试为准。**

## 文档分层

| 层级   | 文档                                                                     | 作用                           |
| ------ | ------------------------------------------------------------------------ | ------------------------------ |
| 执行层 | `../AGENTS.md`、`dev/task-router.md`、`project/implementation-status.md` | Agent 每次任务必读；短、可执行 |
| 原则层 | `../constitution.md`、`.cursor/rules/quantflow-core.mdc`                 | 长期红线与 IDE 常驻提醒        |
| 规格层 | 下表“事实来源”中的主题文档                                               | 按需读取；写完整定义           |
| 记录层 | `project/decision-log.md`、`project/versioning-and-changelog.md`         | 决策与发布记录                 |

**规则：** 执行层不重复规格层全文；规格层之间用链接，不复制整段规则。

## Agent 快速入口

1. `../AGENTS.md`
2. `dev/task-router.md`
3. `project/implementation-status.md`
4. 本表“事实来源”中与本任务相关的一行

## 阅读路径

| 任务                     | 必读                                                                              | 按需补充                              |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------- |
| 任何任务                 | `../AGENTS.md`、`dev/task-router.md`、`project/implementation-status.md`          | `../constitution.md`                  |
| 产品范围或排期           | `project/mvp-scope-and-roadmap.md`、`project/decision-log.md`                     | `product/feature-breakdown.md`        |
| 页面或交互               | `product/information-architecture.md`、`design/ui-guidelines.md`                  | `design/component-spec.md`            |
| Logo / favicon / PWA     | `../assets/brand/README.md`                                                       | `design/ui-guidelines.md`             |
| 前端开发                 | `dev/frontend-guidelines.md`、`api/api-spec.md`                                   | `security/roles-and-permissions.md`   |
| 后端开发                 | `dev/backend-guidelines.md`、`api/api-spec.md`、`architecture/database-schema.md` | `risk/risk-control-rules.md`          |
| 技术栈 / 行情 / 环境     | `dev/technical-baseline.md`                                                       | `architecture/database-schema.md`     |
| 部署 / Cloudflare / 备份 | `dev/deployment.md`                                                               | `dev/technical-baseline.md`           |
| 策略 / 模拟盘            | `strategy/strategy-and-paper-trading-rules.md`                                    | `risk/risk-control-rules.md`          |
| 权限 / 管理端            | `security/roles-and-permissions.md`                                               | `architecture/database-schema.md`     |
| 登录 / 会话 / 邮件       | `security/authentication.md`                                                      | `api/api-spec.md`                     |
| 会员价格 / 配额          | `product/membership-plans.md`                                                     | `security/roles-and-permissions.md`   |
| 测试 / 发布              | `testing/acceptance-criteria.md`                                                  | `project/versioning-and-changelog.md` |
| Codex / Cursor 协作      | `dev/ai-development-workflow.md`                                                  | `dev/code-organization-guidelines.md` |

## 事实来源

同一信息只允许一个文档拥有完整定义，其他文档使用链接或摘要：

| 信息                          | 唯一事实来源                                   | 运行时校验                     |
| ----------------------------- | ---------------------------------------------- | ------------------------------ |
| 长期原则与发布红线            | `../constitution.md`                           | —                              |
| 当前实现进度                  | `project/implementation-status.md`             | 代码、迁移、测试               |
| 任务路由                      | `dev/task-router.md`                           | —                              |
| MVP 模块、优先级、里程碑      | `project/mvp-scope-and-roadmap.md`             | —                              |
| 已决与待决事项                | `project/decision-log.md`                      | —                              |
| 页面、路由、角色路径          | `product/information-architecture.md`          | E2E（待补）                    |
| 策略、信号、模拟撮合公式      | `strategy/strategy-and-paper-trading-rules.md` | 领域单测                       |
| 风险阈值、事件与披露位置      | `risk/risk-control-rules.md`                   | 领域 / API 测试                |
| HTTP 契约与错误码             | `api/api-spec.md`                              | `packages/contracts`、API 测试 |
| 持久化模型                    | `architecture/database-schema.md`              | Prisma schema、migrations      |
| 用户权益与管理员 RBAC         | `security/roles-and-permissions.md`            | 服务端授权测试                 |
| 邮箱登录、Resend 与会话安全   | `security/authentication.md`                   | Auth 模块测试                  |
| 技术版本与行情源              | `dev/technical-baseline.md`                    | 锁文件、CI                     |
| 自有服务器、Cloudflare 与备份 | `dev/deployment.md`                            | 发布脚本、Compose              |
| 会员价格、配额与开通方式      | `product/membership-plans.md`                  | Entitlement 测试               |
| 发布验收                      | `testing/acceptance-criteria.md`               | CI、E2E                        |

冲突处理顺序：显式用户指令 → `AGENTS.md` → `constitution.md` → 上表主题事实来源 → 其他说明性文档。

## 文档状态

| 文档                                                | 状态     | 说明               |
| --------------------------------------------------- | -------- | ------------------ |
| 产品、设计、工程、API、数据库、权限、风控、测试规格 | 基线     | 解释“应该怎么做”   |
| `project/implementation-status.md`                  | 持续更新 | 解释“现在做到哪了” |
| `project/decision-log.md`                           | 持续更新 | 新问题先登记再实现 |
| `project/versioning-and-changelog.md`               | 持续更新 | 可发布变更记录     |

## 维护规则

1. 文档使用简体中文；代码标识、API 字段和行业缩写可用英文。
2. 不复制整段规则；链接到事实来源。
3. 规范写“必须/禁止”，建议写“推荐”，未知项写“待决策”。
4. API 变更同步 API 规格、contracts、调用方和契约测试；数据库变更同步迁移与 schema；权限或风控变更同步验收测试与 `implementation-status.md`。
5. 文档链接使用相对路径并通过检查。

运行 `../scripts/check-docs.sh` 检查链接、版本号、代码围栏和关键一致性。
