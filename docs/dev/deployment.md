# QuantFlow 自有云服务器与 Cloudflare 部署规范

状态：`v0` 部署基线｜目标：共享 Ubuntu VPS 上的独立 Docker Compose 项目

## 1. 部署边界

QuantFlow 复用现有 Petory/CryptoPilot 所在的 Ubuntu 云服务器，但必须保持应用、容器、网络、端口、volume、数据库、环境文件、备份目录和部署密钥独立。

```text
/home/ubuntu/apps/quantflow/
  current/          # 当前 Git checkout
  shared/.env       # 生产密钥，0600，不进入 Git
  backups/          # 恢复过程使用的本地暂存目录
```

服务器地址不得写入仓库。CI/CD 使用 GitHub Environment variable `QUANTFLOW_DEPLOY_HOST`、`QUANTFLOW_DEPLOY_USER=ubuntu` 和 secret `QUANTFLOW_DEPLOY_SSH_KEY`。当前目标主机与 Petory 的生产 VPS 相同。

## 2. 服务与端口

| 服务          | Compose 可见性  | VPS 绑定         | 公网入口                         |
| ------------- | --------------- | ---------------- | -------------------------------- |
| Web / 用户端  | `web:3000`      | `127.0.0.1:3100` | Cloudflare Tunnel Web hostname   |
| 管理端        | `admin:3000`    | `127.0.0.1:3101` | Cloudflare Tunnel Admin hostname |
| API           | `api:3002`      | `127.0.0.1:3102` | Cloudflare Tunnel API hostname   |
| Worker        | Compose network | 无               | 无公网入口                       |
| PostgreSQL 18 | Compose network | 无               | 无公网入口                       |

Compose project name 固定为 `quantflow`，容器和 volume 使用 `quantflow-` 前缀。禁止绑定 `0.0.0.0`，禁止把 PostgreSQL 暴露给宿主机或公网。

## 3. Cloudflare

1. 复用服务器现有 `cloudflared` 服务和共享 Tunnel；将 QuantFlow ingress 加在最终 `http_status:404` 规则之前。
2. 当前生产 hostname 为 `quantflow.chat`、`www.quantflow.chat`、`admin.quantflow.chat` 和 `api.quantflow.chat`；四条 DNS 记录均代理到现有 Tunnel，应用代码不硬编码 Tunnel ID。
3. Tunnel 只连接 `127.0.0.1:3100–3102`。服务器防火墙不开放应用的 80/443/3100–3102 入站端口，只保留密钥登录所需的 SSH 管理入口。
4. Cloudflare 负责公网 DNS、边缘 TLS、DDoS 防护和可用套餐内的 WAF Managed Rules。
5. 缓存只覆盖版本化静态资源、Logo、favicon 和 Next.js `/_next/static/*`；`/api/*`、登录、会话、用户数据及管理操作必须 bypass cache。
6. OTP 请求在前端接入 Turnstile，API 必须调用 Siteverify 做服务端校验；Turnstile 不能替代后端 IP + 邮箱限流。
7. Cloudflare Rate Limiting 优先保护 OTP 请求和验证接口；具体阈值以生产流量验证，后端限流始终是最终安全边界。
8. Cloudflare R2 保存加密数据库备份和用户导出文件；应用不得把数据库凭据或未加密完整备份直接上传。

示例配置见 [`../../deploy/cloudflared-ingress.example.yml`](../../deploy/cloudflared-ingress.example.yml)。Cloudflare 官方说明：[Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)、[WAF Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)、[Turnstile 服务端校验](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。

## 4. 数据与备份

1. PostgreSQL 使用独立 named volume，生产数据库不与其他项目共享实例、用户或 schema。
2. 每日执行完整备份，持续归档 WAL 到 R2；备份上传前使用独立备份密钥加密。
3. 本地保留最近 7 天完整备份，R2 保留最近 30 天；季度执行从 R2 到隔离数据库的恢复演练。
4. 目标 RPO 15 分钟、RTO 4 小时。连续 WAL 归档未验证前不得宣称满足该目标。

## 5. 密钥与可观测性

- Resend、CoinGecko、Turnstile、session、database、R2 和备份密钥只保存在服务器 `shared/.env` 或 CI secrets。
- `.env` 权限必须为 `0600`；容器只注入所需变量，不挂载整个应用目录。
- Docker 日志启用轮转；Sentry 收集前后端异常；Cloudflare Analytics 用于边缘流量与安全事件观察。
- 应用只在请求确实来自本机 `cloudflared` 时信任代理头；审计日志记录规范化客户端 IP，不盲目信任任意 `X-Forwarded-For`。

## 6. 发布与回滚

1. PR 必须通过文档、lint、typecheck、unit、contract 和 build 门禁。
2. 生产发布由 `.github/workflows/deploy-production.yml` 通过 SSH/rsync 同步固定 commit，再调用 `scripts/deploy-production.sh` 构建一个统一 release 镜像、启动 PostgreSQL、执行 `prisma migrate deploy`、更新 Compose 服务并检查 VPS 本机健康端点。GitHub runner 不直接用公网域名作为发布判定，避免 Cloudflare/WAF 对 CI 出口 IP 返回 403 造成误失败。
3. migration 失败必须阻断发布；健康检查失败立即恢复上一镜像 tag。数据库变更优先前滚，任何不可逆 migration 必须先备份并单独审批。
4. Worker 和 API 不得同时运行不兼容 schema；发布顺序遵循 expand → migrate → deploy → contract。

当前仓库已初始化 Web、Admin、API 和 Worker。`deploy/Dockerfile.release` 构建统一镜像 `quantflow/app:<tag>`，`deploy/compose.production.yml` 通过服务级 `APP=web|admin|api|worker` 启动不同进程；该方式避免四个镜像重复安装依赖、重复构建和重复复制 runtime 层。部署失败时脚本恢复上一健康镜像 tag。

当前生产仓库为 [geyaovip/QuantFlow](https://github.com/geyaovip/QuantFlow)（private）。PostgreSQL 18 named volume 挂载到 `/var/lib/postgresql`，以符合 18+ 官方镜像的版本化数据目录布局。
