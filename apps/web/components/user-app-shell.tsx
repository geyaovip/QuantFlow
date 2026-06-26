import {
  Bell,
  ChartNoAxesCombined,
  CircleUserRound,
  Radio,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { UserSession } from "../lib/auth-session";
import { Brand } from "./brand";

const navigation = [
  { href: "/app/strategies", label: "策略", Icon: ChartNoAxesCombined },
  { href: "/app/signals", label: "信号", Icon: Radio },
  { href: "/app/paper-trading", label: "模拟盘", Icon: WalletCards },
  { href: "/app/profile", label: "我的", Icon: CircleUserRound },
];

type UserAppShellProps = {
  children: ReactNode;
  session: UserSession | null;
};

export function UserAppShell({ children, session }: UserAppShellProps) {
  return (
    <div className="user-app-shell">
      <header className="app-topbar">
        <Link href="/app/strategies">
          <Brand />
        </Link>
        <nav aria-label="应用导航">
          {navigation.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="app-topbar__actions">
          {!session ? (
            <Link className="app-login-link" href="/login?next=/app/strategies">
              登录
            </Link>
          ) : null}
          <button className="icon-button" type="button" aria-label="通知">
            <Bell aria-hidden="true" size={19} />
          </button>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <nav className="mobile-bottom-nav" aria-label="移动端应用导航">
        {navigation.map(({ href, label, Icon }) => (
          <Link key={href} href={href}>
            <Icon aria-hidden="true" size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
