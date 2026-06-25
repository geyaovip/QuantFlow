# QuantFlow 认证与 Resend 邮件规范

状态：安全基线｜登录方式已决定｜邮件供应商：Resend

## 1. 职责边界

用户端和管理端统一使用邮箱一次性验证码登录。Resend 仅负责发送验证码邮件；验证码生成、校验、用户/管理员准入、会话签发和撤销全部由 QuantFlow 后端负责。

MVP 不实现密码注册、密码登录或密码重置。不得把 Resend API Key、验证码明文或会话 token 暴露给浏览器。

参考：[Resend Node.js 发送邮件](https://resend.com/docs/send-with-nodejs)、[Resend 域名管理](https://resend.com/docs/dashboard/domains/introduction)。

## 2. 登录流程

1. 客户端获取 Cloudflare Turnstile token，并与邮箱和门户类型 `user` / `admin` 一起请求验证码。
2. 生产服务端先调用 Turnstile Siteverify 校验 token，再规范化邮箱并执行 IP + 邮箱维度限流；无论账号是否存在都返回相同结果。
3. 服务端生成加密安全的 6 位数字验证码，只保存带服务端 pepper 的 hash。
4. 通过服务端 Resend adapter 发送简体中文验证码邮件。
5. 用户提交邮箱、验证码和门户类型；服务端原子校验 hash、用途、有效期、尝试次数和未使用状态。
6. 用户端首次验证成功可创建用户；管理端仅允许已有且启用的 `admin_users` 登录。
7. 服务端把验证码标记为已使用，轮换/创建会话，并通过 `HttpOnly`、`Secure`、合适 `SameSite` 的 Cookie 返回。

用户会话与管理员会话必须区分 audience、cookie 名称和授权 guard；管理员验证码不能用于用户端会话，反之亦然。

## 3. 安全默认值

| 项目       | 默认值               | 规则                               |
| ---------- | -------------------- | ---------------------------------- |
| 验证码长度 | 6 位数字             | 使用 CSPRNG，不使用 `Math.random`  |
| 有效期     | 10 分钟              | 配置化；过期即失效                 |
| 重发冷却   | 60 秒                | 新验证码使同用途旧验证码失效       |
| 最大尝试   | 5 次                 | 超限后作废并记录安全事件           |
| 响应文案   | 固定通用文案         | 防止枚举用户和管理员邮箱           |
| 会话存储   | 服务端可撤销 session | 浏览器仅持有不透明 HttpOnly Cookie |

生产环境必须使用已验证发信域名和专用发件地址。Resend 发送失败不得创建登录成功状态；重试必须避免重复生成多个有效验证码。验证码、API Key、完整 Cookie 和邮件正文不得写日志。

## 4. 配置

应用初始化后在 `.env.example` 中声明且不提供真实值。生产环境当前使用独立 Resend 账号；`quantflow.chat` 发信域名和 API Key 必须由该账号单独创建，不复用其他项目 key。

```text
RESEND_API_KEY=
AUTH_EMAIL_FROM=QuantFlow <login@example.com>
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
AUTH_OTP_PEPPER=
AUTH_OTP_TTL_SECONDS=600
AUTH_OTP_RESEND_COOLDOWN_SECONDS=60
AUTH_OTP_MAX_ATTEMPTS=5
AUTH_SESSION_TTL_SECONDS=2592000
```

启动时校验生产环境的 Resend API Key、发件地址、Turnstile keys 和 pepper。邮件与 Turnstile adapter 必须可在测试中替换为 fake，不允许单元测试调用外部服务。Turnstile token 必须服务端校验且单次使用；前端组件成功不构成安全验证。

## 5. 邮件内容

主题使用“QuantFlow 登录验证码”。正文必须包含验证码、10 分钟有效期、非本人操作可忽略、安全提醒和 QuantFlow 品牌名；不得包含收益营销、外部跳转或要求回复邮件的文案。

## 6. 审计与监控

- 记录请求、发送结果、验证成功/失败、限流、锁定和会话撤销事件，但只记录脱敏邮箱及 provider message ID。
- Resend 接受邮件只表示发送请求被接受，不等于身份验证成功；认证成功只以验证码原子校验为准。
- 管理员登录成功、失败和异常频率必须进入安全审计与告警。
- 邮件 delivery webhook 如启用，必须验签、幂等处理，只用于投递监控，不改变认证结果。

## 7. 验收

1. 用户端和管理端均无密码输入、注册密码或重置密码入口。
2. 两端共用认证领域服务与 Resend adapter，但会话 audience 和权限严格隔离。
3. 验证码单次使用、过期、重发失效、错误次数和并发验证均有自动化测试。
4. 未注册用户、禁用用户、未知管理员的请求响应不可用于账号枚举。
5. Resend 不可用时返回可恢复的中文错误，不签发会话。
6. API Key、验证码和会话秘密不出现在客户端、日志、错误响应或数据库明文字段中。
7. 生产 OTP 请求缺少、伪造、过期或重复使用 Turnstile token 时拒绝发送；Cloudflare 不可用时返回可恢复错误，且后端限流仍生效。
