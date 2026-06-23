import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "info" | "profit" | "loss" | "warning";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`qf-badge qf-badge--${tone}`}>{children}</span>;
}

export function RiskBadge({ level }: { level: "低" | "中" | "高" }) {
  const tone = level === "低" ? "profit" : level === "中" ? "warning" : "loss";
  return <Badge tone={tone}>{level}风险</Badge>;
}
