export const primaryAppRoutes = [
  { href: "/app/strategies", label: "策略" },
  { href: "/app/signals", label: "信号" },
  { href: "/app/my-strategies", label: "我的策略" },
  { href: "/app/paper-trading", label: "模拟盘" },
  { href: "/app/membership", label: "会员权益" },
  { href: "/app/profile", label: "个人中心" },
] as const;

export const profileAppRoute = {
  href: "/app/profile",
  label: "我的",
} as const;

export const mobileAppRoutes = [
  { href: "/app/strategies", label: "策略" },
  { href: "/app/signals", label: "信号" },
  { href: "/app/paper-trading", label: "模拟盘" },
  profileAppRoute,
] as const;

export function isAppRouteActive(pathname: string, href: string) {
  if (href === "/app/strategies") {
    return (
      pathname === "/app/strategies" || pathname.startsWith("/app/strategies/")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
