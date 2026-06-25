# QuantFlow 任务路由

Agent 接到任务后，先在本表定位类型，再只读取列出的文档与代码；不要加载整个 `docs/`。

开始前必读：

1. `../../AGENTS.md`
2. `../project/implementation-status.md`
3. 本表对应行

## 路由表

| 任务类型           | 必读文档                                                                  | 主要改动目录                                            | 必跑命令                                                      |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| 任何任务           | `AGENTS.md`、`implementation-status.md`                                   | —                                                       | 按改动范围选择下方命令                                        |
| 新增 / 修改 API    | `api-spec.md`、`database-schema.md`、`roles-and-permissions.md`（若涉权） | `apps/api`、`packages/contracts`                        | `pnpm --filter @quantflow/api test` → `pnpm typecheck`        |
| 数据库迁移         | `database-schema.md`、相关领域规则                                        | `apps/api/prisma`、`apps/api/src/modules/*`             | `pnpm --filter @quantflow/api db:generate` → `pnpm typecheck` |
| 新增 `/app` 页面   | `information-architecture.md`、`ui-guidelines.md`、`component-spec.md`    | `apps/web`、`packages/ui`                               | `pnpm --filter @quantflow/web typecheck` → `pnpm check`       |
| 新增 `/admin` 页面 | 同上 + `roles-and-permissions.md`                                         | `apps/admin`、`packages/ui`                             | `pnpm --filter @quantflow/admin typecheck` → `pnpm check`     |
| 官网营销页         | `information-architecture.md`、`ui-guidelines.md`                         | `apps/web/app/page.tsx` 及相邻组件                      | `pnpm --filter @quantflow/web typecheck`                      |
| 登录 / 会话        | `authentication.md`、`api-spec.md`                                        | `apps/api/src/modules/auth`、`apps/web` 或 `apps/admin` | `pnpm --filter @quantflow/api test` → `pnpm check`            |
| 策略 / 信号        | `strategy-and-paper-trading-rules.md`、`api-spec.md`                      | `apps/api`、`apps/web`、`packages/contracts`            | 领域单测 → `pnpm check`                                       |
| 模拟盘             | `strategy-and-paper-trading-rules.md`、`risk-control-rules.md`            | `apps/api`、`apps/worker`、`apps/web`                   | 领域单测 → `pnpm check`                                       |
| 会员 / 权益        | `membership-plans.md`、`roles-and-permissions.md`                         | `apps/api`、`apps/web`、`apps/admin`                    | `pnpm check`                                                  |
| 风控               | `risk-control-rules.md`、`acceptance-criteria.md`                         | `apps/api`、`apps/admin`                                | `pnpm check`                                                  |
| Worker / 行情      | `technical-baseline.md`、`strategy-and-paper-trading-rules.md`            | `apps/worker`、`apps/api`                               | `pnpm --filter @quantflow/worker typecheck` → `pnpm check`    |
| 部署 / 运维        | `deployment.md`、`technical-baseline.md`                                  | `deploy/`、`scripts/`、`.github/workflows/`             | `pnpm build`；按需手动验证发布脚本                            |
| 文档-only          | `docs/README.md` 事实来源表                                               | `docs/`、`AGENTS.md`（若影响执行规则）                  | `./scripts/check-docs.sh`                                     |
| 新商业 / 技术决策  | `decision-log.md`                                                         | 先写决策，再改代码                                      | `./scripts/check-docs.sh`                                     |

## 垂直切片顺序

同一任务内推荐顺序：

1. 契约 / schema / 迁移
2. 领域规则与 repository
3. Use Case 与 API
4. 前端页面与共享组件
5. 测试、文档、`implementation-status.md`

## 变更后同步

| 改动           | 必须同步                                      |
| -------------- | --------------------------------------------- |
| 可运行行为变化 | `implementation-status.md`                    |
| API / 错误码   | `api-spec.md`、`packages/contracts`、契约测试 |
| 表结构         | `database-schema.md`、Prisma migration        |
| 页面 / 路由    | `information-architecture.md`、相关验收项     |
| 新决策         | `decision-log.md`                             |
| 可发布变更     | `versioning-and-changelog.md`                 |

完整矩阵见 `ai-development-workflow.md`。同一规则只在一处写完整定义，其他文档链接即可。

## 任务输入模板

```text
目标：
范围：
任务类型：（对应上表一行）
事实来源：
非目标：
验收命令：
待决策：（decision-log ID，无则写“无”）
```
