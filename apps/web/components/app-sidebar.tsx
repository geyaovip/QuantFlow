"use client";

import { ChartNoAxesCombined, Layers3, Radio, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserSession } from "../lib/auth-session";
import { isAppRouteActive, primaryAppRoutes } from "../lib/app-navigation";
import { AppUserMenu } from "./app-user-menu";
import { Brand } from "./brand";

const routeIcons = {
  "/app/strategies": ChartNoAxesCombined,
  "/app/signals": Radio,
  "/app/my-strategies": Layers3,
  "/app/paper-trading": WalletCards,
} as const;

type AppSidebarProps = {
  apiBaseUrl: string;
  session: UserSession | null;
};

export function AppSidebar({ apiBaseUrl, session }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="应用侧边导航">
      <div className="app-sidebar__brand">
        <Link href="/" aria-label="返回 QuantFlow 首页">
          <Brand />
        </Link>
      </div>
      <nav aria-label="应用主导航" className="app-sidebar__nav">
        {primaryAppRoutes.map(({ href, label }) => {
          const Icon = routeIcons[href];
          const active = isAppRouteActive(pathname, href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={
                active ? "app-sidebar__link is-active" : "app-sidebar__link"
              }
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="app-sidebar__footer">
        <AppUserMenu apiBaseUrl={apiBaseUrl} session={session} />
      </div>
    </aside>
  );
}
