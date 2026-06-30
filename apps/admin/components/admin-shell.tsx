import {
  Activity,
  ChartNoAxesCombined,
  CreditCard,
  FileClock,
  Megaphone,
  Radio,
  Shield,
  ShieldAlert,
  Users,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { resolveApiBaseUrl } from "../lib/strategy-api";
import type { AdminSession } from "../lib/auth-session";
import { AdminLogoutButton } from "./admin-logout-button";

const navGroups = [
  {
    label: "总览",
    links: [{ href: "/admin", label: "数据看板", Icon: ChartNoAxesCombined }],
  },
  {
    label: "运营",
    links: [
      { href: "/admin/users", label: "用户管理", Icon: Users },
      { href: "/admin/memberships", label: "会员管理", Icon: CreditCard },
      { href: "/admin/announcements", label: "系统公告", Icon: Megaphone },
    ],
  },
  {
    label: "策略与模拟",
    links: [
      { href: "/admin/strategies", label: "策略管理", Icon: Activity },
      { href: "/admin/signals", label: "信号管理", Icon: Radio },
      { href: "/admin/paper-accounts", label: "模拟盘管理", Icon: WalletCards },
    ],
  },
  {
    label: "安全",
    links: [
      { href: "/admin/risk", label: "风险管理", Icon: ShieldAlert },
      { href: "/admin/access", label: "角色权限", Icon: Shield },
      { href: "/admin/audit", label: "审计日志", Icon: FileClock },
    ],
  },
];

export function AdminShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AdminSession | null;
}) {
  const identity = session?.email ?? session?.displayName;
  const initials = (session?.displayName ?? session?.email ?? "A")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <Image
            src="/brand/quantflow-mark-white.svg"
            width={30}
            height={30}
            alt=""
            priority
          />
          <span>
            <strong>QuantFlow</strong>
            <small>管理后台</small>
          </span>
        </Link>
        <nav aria-label="管理后台导航">
          {navGroups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span className="admin-nav-group__label">{group.label}</span>
              {group.links.map(({ href, label, Icon }) => (
                <Link href={href} key={href}>
                  <Icon aria-hidden="true" size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          {identity ? (
            <>
              <div className="admin-sidebar__avatar">{initials}</div>
              <div className="admin-sidebar__identity">
                <span>{identity}</span>
                <small>管理员</small>
              </div>
              <AdminLogoutButton apiBaseUrl={resolveApiBaseUrl()} />
            </>
          ) : (
            <div className="admin-sidebar__identity admin-sidebar__identity--full">
              <span>会话读取中</span>
              <small>刷新后仍异常请重新登录</small>
            </div>
          )}
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>运行状态</span>
            <strong>后台在线</strong>
          </div>
          <span>敏感操作已接入审计</span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
