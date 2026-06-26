"use client";

import {
  ChartNoAxesCombined,
  CircleUserRound,
  Radio,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isAppRouteActive, mobileAppRoutes } from "../lib/app-navigation";

const routeIcons = {
  "/app/strategies": ChartNoAxesCombined,
  "/app/signals": Radio,
  "/app/paper-trading": WalletCards,
  "/app/profile": CircleUserRound,
} as const;

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="移动端应用导航">
      {mobileAppRoutes.map(({ href, label }) => {
        const Icon = routeIcons[href];
        const active = isAppRouteActive(pathname, href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
