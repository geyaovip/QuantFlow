# QuantFlow

QuantFlow 是面向中国用户的加密货币策略信号与模拟盘平台。当前仓库处于 `v0.2` 基础开发阶段，monorepo、三端页面骨架、API、Worker、共享组件和部署基础已经初始化。

产品采用“官网营销页 + 应用工作台 + 管理后台”分离架构：根路径 `/` 是官网首页，`/app` 是用户应用工作台，`/admin` 是独立管理后台。

> QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。

## MVP 边界

MVP 包含官网首页、应用工作台、策略广场、策略详情、信号中心、模拟盘、会员权益与订阅流程、通知、个人中心和管理后台。

路径边界：

1. `/`：官网营销页，用于品牌、信任、转化和风险教育；主要 CTA 是“进入应用”。
2. `/app`：应用工作台，承载策略广场、策略详情、信号中心、模拟盘、我的策略、会员订阅和个人中心；必须重定向到 `/app/strategies`。
3. `/admin`：管理后台，承载数据看板、用户管理、策略管理、信号管理、模拟盘管理、会员管理、风险管理和权限审计。

MVP 禁止提供真实交易所连接、真实资产读取、真实订单、半自动或全自动交易，以及用户提交交易所 API Key 的入口。所有模拟对象在代码和界面中必须使用 `paper` / “模拟”命名。

## 开始开发前

1. 阅读 [AGENTS.md](./AGENTS.md)；这是 Codex、Cursor 和贡献者的执行入口。
2. 阅读 [项目宪法](./constitution.md)；它定义长期不变的产品与工程原则。
3. 从 [文档索引](./docs/README.md) 找到当前任务的唯一事实来源。
4. 查看 [决策日志](./docs/project/decision-log.md)；当前前置决策已关闭，新选择必须先登记。
5. 按 [AI 开发工作流](./docs/dev/ai-development-workflow.md) 完成实现、测试和文档同步。

## 当前基线

| 项目         | 状态                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| 产品目标     | `v1.0.0 MVP`                                                                              |
| 文档基线     | `docs-v0.4.0`                                                                             |
| 应用代码     | `v0.2` 开发中；Web、Admin、API、Worker 已可构建                                           |
| 默认语言     | 简体中文                                                                                  |
| 产品结构     | `/` 官网营销页、`/app` 应用工作台、`/admin` 管理后台                                      |
| 实盘交易能力 | 禁止且默认关闭                                                                            |
| 会员         | Free/Pro/Premium 权益已确定；MVP 仅人工/邀请码/测试开通，在线支付关闭                     |
| 登录         | 用户端、管理端统一邮箱验证码；Resend 负责邮件投递                                         |
| UI           | MVP 默认浅色；白/灰/黑、深色主操作、低频低饱和蓝                                          |
| UI 基线      | v0 design tokens；基础组件优先；所有页面自适应                                            |
| 品牌资源     | [`assets/brand/README.md`](./assets/brand/README.md)；含 favicon、PWA、用户端与管理端版本 |
| 技术栈       | Node 24、pnpm 11、Next 16、Nest 11、Prisma 7、PostgreSQL 18                               |
| 行情         | CoinGecko；BTC/ETH/SOL USDT；60 秒采集                                                    |
| 部署         | 现有 Ubuntu VPS；独立 Docker Compose + PostgreSQL 18 + Cloudflare Tunnel/WAF/Turnstile/R2 |
| 分页         | 用户默认 20，管理端默认 50，最大 100，无限滚动禁用                                        |

## 代码结构

当前仓库采用 pnpm workspace monorepo：

```text
QuantFlow/
├── apps/
│   ├── web/          # 官网 / 与应用工作台 /app，Next.js
│   ├── admin/        # 管理后台 /admin，Next.js
│   ├── api/          # 后端 HTTP API，NestJS 模块化单体
│   └── worker/       # 后台任务进程，行情采集、outbox、异步任务
├── packages/
│   ├── ui/           # 共享组件、设计 tokens、品牌资源同步目标
│   └── contracts/    # API 契约、错误码、共享类型
├── docs/             # 产品、设计、研发、架构、风控、测试文档
├── assets/
│   └── brand/        # QuantFlow Logo、favicon、PWA 图标源文件
├── deploy/           # 生产部署 Dockerfile、Compose、Cloudflare 示例
├── scripts/          # 文档检查、品牌资源生成/同步、部署脚本
├── compose.yaml      # 本地开发依赖
├── AGENTS.md         # Agent/贡献者执行规则
├── constitution.md   # 项目宪法与发布红线
└── README.md         # 项目总入口
```

产品路径与代码应用对应关系：

| 产品入口  | 代码位置      | 说明                                       |
| --------- | ------------- | ------------------------------------------ |
| `/`       | `apps/web`    | 官网营销页，负责品牌、信任、转化和风险教育 |
| `/app`    | `apps/web`    | 应用工作台，默认进入 `/app/strategies`     |
| `/admin`  | `apps/admin`  | 管理后台，负责运营管理                     |
| `/api/v1` | `apps/api`    | 后端 API                                   |
| Worker    | `apps/worker` | 后台任务与异步处理                         |

## 本地运行

前置要求：Node.js 24、pnpm 11、Docker（需要本地 PostgreSQL 时）。

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm dev
```

本地入口：

- 官网与应用工作台：`http://localhost:3000`、`http://localhost:3000/app/strategies`
- 管理后台：`http://localhost:3001/admin`
- API 健康检查：`http://localhost:3002/api/v1/health`
- Feature flags：`http://localhost:3002/api/v1/system/feature-flags`

## 验证命令

```bash
pnpm check
pnpm build
```

`pnpm check` 依次执行文档、格式、lint、类型和测试检查。品牌资源在 dev/build 前由 `scripts/sync-brand-assets.mjs` 同步到 Web 与 Admin 的 public 目录。

当前可运行的仓库检查：`./scripts/check-docs.sh`。

## 常用命令

```bash
pnpm check       # 文档、格式、lint、类型和测试
pnpm build       # 构建全部 workspace
pnpm test        # 运行测试
pnpm typecheck   # TypeScript 类型检查
pnpm lint        # ESLint
pnpm format      # Prettier 格式化
```

## 贡献约束

开发前先阅读：

1. [项目宪法](./constitution.md)
2. [Agent 执行规则](./AGENTS.md)
3. [文档索引](./docs/README.md)
4. [决策日志](./docs/project/decision-log.md)

涉及范围、API、数据库、权限、风控、计算口径或页面路径的变更，必须同步更新对应事实来源文档。
