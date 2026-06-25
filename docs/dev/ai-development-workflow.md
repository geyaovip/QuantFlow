# Codex / Cursor 开发工作流

本流程用于把文档规格转为可验证代码，避免 Agent 在超大上下文中猜测业务决策。

## 任务输入模板

```text
目标：一个可验证的结果
范围：允许修改的目录或模块
事实来源：本任务相关文档
非目标：明确不做的能力
验收：可运行的命令和业务场景
待决策：如有，引用 decision-log ID
```

## 执行顺序

1. **定位**：读 `task-router.md`、`implementation-status.md`、任务事实来源与现有代码/测试。
2. **核对**：列出当前行为与目标差异；发现待决策项时实现禁用状态或停在决策边界。
3. **实现**：按最小垂直切片修改，服务端先落实状态、权限、风控和精度约束。
4. **验证**：优先运行最窄测试，再运行受影响包的 typecheck、lint 和测试。
5. **同步**：只更新拥有该定义的文档；更新 `implementation-status.md`；不要把变更复制到所有文档。
6. **交付**：报告结果、文件、命令、未验证项和风险。

## 任务拆分原则

- 每个任务只交付一个业务结果，例如“创建模拟盘并执行配额校验”，不要写“完成模拟盘模块”。
- API、数据库迁移、领域逻辑、UI 和测试可以作为一个垂直切片，但各自保持独立文件。
- 不同时重构无关模块；不以满足行数为目的做无语义拆分。
- 未初始化工程时，先按 `technical-baseline.md` 初始化 monorepo、锁文件和运行命令，并按 `security/authentication.md` 接入 Resend 邮箱验证码。

## 变更同步矩阵

| 改动                  | 必须同步                                        |
| --------------------- | ----------------------------------------------- |
| 可运行行为 / 模块进度 | `implementation-status.md`                      |
| 产品范围 / 优先级     | roadmap、feature breakdown、acceptance criteria |
| 页面 / 用户路径       | information architecture、相关 UI 验收          |
| API 请求响应 / 错误码 | API spec、类型、契约测试                        |
| 表、字段、约束        | database schema、迁移、repository 测试          |
| 权益 / RBAC           | roles and permissions、服务端授权测试           |
| 策略 / 模拟公式       | domain rules、单元测试、API 字段说明            |
| 风控阈值 / 处置       | risk rules、事件测试、管理端验收                |
| 用户文案              | 文案常量、UI 规格、合规扫描测试                 |

## Agent 自检

- 是否引入或暴露实盘能力？
- 是否把用户行为误建模为领域对象状态？
- 是否展示收益但遗漏同周期风险？
- 是否只在前端检查权限或 feature flag？
- 是否使用浮点计算金额或比例？
- 是否遗漏管理员审计日志？
- 是否自行决定了 `Q-*` 项？
- 是否运行并报告了可用验证？

推荐让 Cursor 自动加载 `.cursor/rules/quantflow-core.mdc`；Codex 从根目录工作以自动发现 `AGENTS.md`。子目录如以后需要更严格规则，可新增局部 `AGENTS.md`，但不得放宽根规则。
