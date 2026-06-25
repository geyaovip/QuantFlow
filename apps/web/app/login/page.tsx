import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "../../components/brand";
import { EmailOtpLogin } from "../../components/auth/email-otp-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "登录",
  description: "使用邮箱验证码登录 QuantFlow 应用工作台。",
  robots: { index: false, follow: false },
};

function resolveApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.quantflow.chat";
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  return (
    <LoginPageContent
      apiBaseUrl={resolveApiBaseUrl()}
      searchParams={searchParams}
      siteKey={process.env.TURNSTILE_SITE_KEY}
    />
  );
}

async function LoginPageContent({
  apiBaseUrl,
  searchParams,
  siteKey,
}: {
  apiBaseUrl: string;
  searchParams?: Promise<{ next?: string }>;
  siteKey?: string;
}) {
  const params = await searchParams;
  const nextPath = params?.next?.startsWith("/app")
    ? params.next
    : "/app/strategies";

  return (
    <main className="auth-page">
      <div className="auth-page__brand">
        <Link href="/" aria-label="返回 QuantFlow 首页">
          <Brand />
        </Link>
        <Link href="/">返回官网</Link>
      </div>
      <section className="auth-page__grid">
        <div className="auth-copy">
          <p>QuantFlow 应用工作台</p>
          <h2>先验证身份，再查看策略、信号和模拟盘。</h2>
          <ul>
            <li>用户端与管理端统一使用 Resend 邮箱验证码。</li>
            <li>验证码只由后端生成和校验，浏览器不保存明文会话。</li>
            <li>所有策略信号仅供参考，不连接交易所、不读取真实资产。</li>
          </ul>
        </div>
        <EmailOtpLogin
          apiBaseUrl={apiBaseUrl}
          nextPath={nextPath}
          siteKey={siteKey}
        />
      </section>
    </main>
  );
}
