import {
  Activity,
  ChartNoAxesCombined,
  FileClock,
  Radio,
  Shield,
  ShieldAlert,
  Users,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/admin", label: "数据看板", Icon: ChartNoAxesCombined },
  { href: "/admin/users", label: "用户管理", Icon: Users },
  { href: "/admin/strategies", label: "策略管理", Icon: Activity },
  { href: "/admin/signals", label: "信号管理", Icon: Radio },
  { href: "/admin/paper-accounts", label: "模拟盘管理", Icon: WalletCards },
  { href: "/admin/risk", label: "风险管理", Icon: ShieldAlert },
  { href: "/admin/access", label: "角色权限", Icon: Shield },
  { href: "/admin/audit", label: "审计日志", Icon: FileClock },
];

export function AdminShell({ children }: { children: ReactNode }) {
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
          {links.map(({ href, label, Icon }) => (
            <Link href={href} key={href}>
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <span>RBAC 已接入</span>
          <small>敏感操作写入审计日志</small>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>生产状态</span>
            <strong>开发环境</strong>
          </div>
          <Link href="/login">管理员登录</Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
