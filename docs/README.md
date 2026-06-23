# QuantFlow 文档索引

本目录保存开发前的可执行规格。文档基线为 `docs-v0.4.0`，应用初始化后应以代码、迁移、OpenAPI 和自动化测试校验这些规格。

## 阅读路径

| 任务                      | 必读文档                                                                          | 按需补充                              |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------- |
| 任何任务                  | `../AGENTS.md`                                                                    | `../constitution.md`                  |
| 产品范围或排期            | `project/mvp-scope-and-roadmap.md`、`project/decision-log.md`                     | `product/feature-breakdown.md`        |
| 页面或交互                | `product/information-architecture.md`、`design/ui-guidelines.md`                  | `design/component-spec.md`            |
| Logo、favicon 或 PWA 图标 | `../assets/brand/README.md`                                                       | `design/ui-guidelines.md`             |
| 前端开发                  | `dev/frontend-guidelines.md`、`api/api-spec.md`                                   | `security/roles-and-permissions.md`   |
| 后端开发                  | `dev/backend-guidelines.md`、`api/api-spec.md`、`architecture/database-schema.md` | `risk/risk-control-rules.md`          |
| 技术栈、行情或环境        | `dev/technical-baseline.md`                                                       | `architecture/database-schema.md`     |
| 部署、Cloudflare 或备份   | `dev/deployment.md`                                                               | `dev/technical-baseline.md`           |
| 策略或模拟盘              | `strategy/strategy-and-paper-trading-rules.md`                                    | `risk/risk-control-rules.md`          |
| 权限或管理端              | `security/roles-and-permissions.md`                                               | `architecture/database-schema.md`     |
| 登录、会话或邮件          | `security/authentication.md`                                                      | `api/api-spec.md`                     |
| 会员价格、配额或开通      | `product/membership-plans.md`                                                     | `security/roles-and-permissions.md`   |
| 测试或发布                | `testing/acceptance-criteria.md`                                                  | `project/versioning-and-changelog.md` |
| Codex/Cursor 协作         | `dev/ai-development-workflow.md`                                                  | `dev/code-organization-guidelines.md` |

## 事实来源

同一信息只允许一个文档拥有完整定义，其他文档使用链接或摘要：

| 信息                          | 唯一事实来源                                   |
| ----------------------------- | ---------------------------------------------- |
| 长期原则与发布红线            | `../constitution.md`                           |
| MVP 模块、优先级、里程碑      | `project/mvp-scope-and-roadmap.md`             |
| 已决与待决事项                | `project/decision-log.md`                      |
| 页面、路由、角色路径          | `product/information-architecture.md`          |
| 策略、信号、模拟撮合公式      | `strategy/strategy-and-paper-trading-rules.md` |
| 风险阈值、事件与披露位置      | `risk/risk-control-rules.md`                   |
| HTTP 契约与错误码             | `api/api-spec.md`                              |
| 持久化模型                    | `architecture/database-schema.md`              |
| 用户权益与管理员 RBAC         | `security/roles-and-permissions.md`            |
| 邮箱登录、Resend 与会话安全   | `security/authentication.md`                   |
| 技术版本与行情源              | `dev/technical-baseline.md`                    |
| 自有服务器、Cloudflare 与备份 | `dev/deployment.md`                            |
| 会员价格、配额与开通方式      | `product/membership-plans.md`                  |
| 发布验收                      | `testing/acceptance-criteria.md`               |

冲突处理顺序：显式用户指令 → `AGENTS.md` → `constitution.md` → 上表的主题事实来源 → 其他说明性文档。发现冲突时修正文档，不在实现中静默选择。

## 文档状态

| 文档                                                | 状态     | 说明                                     |
| --------------------------------------------------- | -------- | ---------------------------------------- |
| 产品、设计、工程、API、数据库、权限、风控、测试规格 | 基线     | 可用于项目初始化；实现时需转为可运行契约 |
| `project/decision-log.md`                           | 持续更新 | 当前前置决策已关闭；新问题先登记再实现   |
| `project/versioning-and-changelog.md`               | 持续更新 | 每次可发布变更更新                       |

## 维护规则

1. 文档使用简体中文；代码标识、API 字段和行业缩写可用英文。
2. 不复制整段规则；链接到事实来源。
3. 规范写“必须/禁止”，建议写“推荐”，未知项写“待决策”，避免模糊的“可考虑”。
4. API 变更同步 API 规格、schema、调用方和契约测试；数据库变更同步迁移与 schema；权限或风控变更同步验收测试。
5. 文档链接必须使用相对路径并通过检查。

运行 `../scripts/check-docs.sh` 检查本地链接、代码围栏、尾随空格和已删除文档引用。
