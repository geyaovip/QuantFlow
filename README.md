# QuantFlow · 策略研究与模拟验证平台

围绕加密资产策略信号与模拟盘验证的 Web 平台，将策略浏览、信号跟踪、模拟账户、会员权益和运营治理组织为完整的产品结构。采用官网、应用工作台、管理后台、API 与 Worker 分层部署。

[产品官网](https://quantflow.chat/) · [应用工作台](https://quantflow.chat/app/strategies) · [管理后台](https://admin.quantflow.chat/admin) · [实现状态](docs/project/implementation-status.md)

官网可公开浏览；应用和后台按账号权限访问。**当前处于持续开发阶段，已接入模块与部分实现范围以状态地图为准。**

## 主要模块

| 模块 | 当前实现内容 |
| --- | --- |
| 策略研究 | 策略列表、详情、订阅及服务端访问权益校验。 |
| 信号中心 | 信号列表与详情、方向和状态筛选，并关联模拟盘使用。 |
| 模拟盘 | 模拟账户、策略联动、恢复复检及行情过期校验。 |
| 会员与通知 | 会员计划、邀请码、支付接口和通知偏好等部分流程。 |
| 运营治理 | 策略审核、信号治理、用户管理、风险事件、权限与审计。 |
| 行情与任务 | Worker 行情刷新、认证记录清理和相关后台处理。 |

本项目仅用于策略信息研究与模拟验证，不提供交易所连接、真实资产读取或实盘下单，不承诺投资收益。支付是否开放由部署配置控制；不应将接口存在视为真实支付验收完成。

## 工程设计

- **前后端契约共享**：使用 `packages/contracts` 统一 API 类型和错误边界。
- **服务端约束**：权限、会员权益、风控与功能开关在服务端校验。
- **金额精度**：价格、数量、费用与比例按 Decimal 语义处理。
- **模拟与实盘隔离**：模拟对象采用明确命名，实盘功能开关固定关闭。
- **发布与恢复**：包含独立 Compose、数据库迁移、健康检查、备份与回滚脚本。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 用户端与管理端 | Next.js、React、TypeScript |
| API | NestJS 模块化单体 |
| 数据 | PostgreSQL 18、Prisma |
| 后台任务 | 独立 Node.js Worker |
| 工程 | Node.js 24、pnpm 11、Vitest、端到端测试与 GitHub Actions |
| 部署 | Docker Compose、GHCR、Cloudflare Tunnel |

## 本地运行

需要 Node.js 24、仓库指定的 pnpm 版本与 Docker。

```bash
git clone https://github.com/geyaovip/QuantFlow.git
cd QuantFlow
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d postgres
pnpm --filter @quantflow/api db:generate
pnpm --filter @quantflow/api db:deploy
pnpm dev
```

先按环境模板完成配置，数据库迁移与外部服务设置见[开发文档](docs/README.md)。测试和种子数据仅在独立开发环境执行。

| 服务 | 本地地址 |
| --- | --- |
| 官网 | http://localhost:3000 |
| 应用工作台 | http://localhost:3000/app/strategies |
| 管理后台 | http://localhost:3001/admin |
| API 健康检查 | http://localhost:3002/api/v1/health |

## 项目结构与检查

```text
apps/web/          官网与应用工作台
apps/admin/        运营管理后台
apps/api/          HTTP API 与领域模块
apps/worker/       行情与后台任务
packages/ui/       共享组件与品牌资源
packages/contracts/ 共享接口契约
packages/e2e/      端到端测试
deploy/            生产部署配置
```

```bash
pnpm check
pnpm build
```

`check` 包含文档、产品边界文案、验收检查、格式、Lint、类型与测试。生产部署方式见[部署规范](docs/dev/deployment.md)，开发任务从[任务路由](docs/dev/task-router.md)进入。外部邮件、行情、支付与生产恢复能力需分别验证。
