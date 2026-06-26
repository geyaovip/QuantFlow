import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "../../components/brand";
import { EmailOtpLogin } from "../../components/auth/email-otp-login";
import { getUserSession } from "../../lib/auth-session";
import { resolveApiBaseUrl } from "../../lib/api-base-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "登录",
  description: "登录 QuantFlow 应用工作台。",
  robots: { index: false, follow: false },
};

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
  const session = await getUserSession();
  if (session) {
    redirect(nextPath);
  }

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
          <p>QuantFlow</p>
          <h2>登录你的策略工作台</h2>
          <span>查看策略、信号和模拟盘。</span>
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
