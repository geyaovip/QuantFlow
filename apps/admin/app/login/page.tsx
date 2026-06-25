import type { Metadata } from "next";
import Image from "next/image";

import { AdminEmailOtpLogin } from "../../components/auth/admin-email-otp-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理员登录",
  robots: { index: false, follow: false },
};

function resolveApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.quantflow.chat";
}

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-panel">
        <div className="admin-login-brand">
          <Image
            src="/brand/quantflow-mark-white.svg"
            width={34}
            height={34}
            alt=""
            priority
          />
          <span>
            <strong>QuantFlow</strong>
            <small>管理后台</small>
          </span>
        </div>
        <div className="admin-login-copy">
          <p>运营与风控管理</p>
          <h1>敏感操作先认证，后授权，全部留痕。</h1>
          <ul>
            <li>仅预授权管理员邮箱可登录。</li>
            <li>管理员会话与用户会话 audience 分离。</li>
            <li>策略、信号、会员、风险和权限变更必须写审计日志。</li>
          </ul>
        </div>
      </section>
      <AdminEmailOtpLogin
        apiBaseUrl={resolveApiBaseUrl()}
        siteKey={process.env.TURNSTILE_SITE_KEY}
      />
    </main>
  );
}
