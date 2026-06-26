import { Bell } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { UserSession } from "../lib/auth-session";
import { AppMobileNav } from "./app-mobile-nav";
import { AppSidebar } from "./app-sidebar";
import { Brand } from "./brand";

type UserAppShellProps = {
  apiBaseUrl: string;
  children: ReactNode;
  session: UserSession | null;
};

export function UserAppShell({
  apiBaseUrl,
  children,
  session,
}: UserAppShellProps) {
  return (
    <div className="user-app-shell">
      <AppSidebar apiBaseUrl={apiBaseUrl} session={session} />
      <div className="app-main">
        <header className="app-mobile-topbar">
          <Link href="/" aria-label="返回 QuantFlow 首页">
            <Brand compact />
          </Link>
          <div className="app-mobile-topbar__actions">
            {!session ? (
              <Link
                className="app-login-link"
                href="/login?next=/app/strategies"
              >
                登录
              </Link>
            ) : null}
            <button className="icon-button" type="button" aria-label="通知">
              <Bell aria-hidden="true" size={19} />
            </button>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      <AppMobileNav />
    </div>
  );
}
