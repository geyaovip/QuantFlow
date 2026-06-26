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
          <p>Admin console</p>
          <h1>QuantFlow 运营后台</h1>
        </div>
      </section>
      <AdminEmailOtpLogin
        apiBaseUrl={resolveApiBaseUrl()}
        siteKey={process.env.TURNSTILE_SITE_KEY}
      />
    </main>
  );
}
