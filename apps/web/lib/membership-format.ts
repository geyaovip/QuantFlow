import type { MembershipPlan } from "@quantflow/contracts";

export function formatPlanPrice(plan: MembershipPlan) {
  if (plan.tier === "free") {
    return "¥0";
  }

  return `¥${trimPrice(plan.monthlyPriceCny)}/月`;
}

export function formatPlanPerks(plan: MembershipPlan) {
  const lookup = Object.fromEntries(
    plan.entitlements.map((item) => [item.key, item.value]),
  );

  const perks = [
    `${lookup.strategy_subscriptions_max ?? "0"} 个策略订阅`,
    `${lookup.paper_accounts_max ?? "0"} 个模拟盘`,
    plan.tier === "free" ? "15 分钟信号延迟" : "更快信号触达",
  ];

  if (plan.tier === "premium") {
    perks.push("优先客服支持");
  }

  return perks;
}

export function formatPlanSummary(plan: MembershipPlan) {
  if (plan.tier === "free") {
    return "体验策略浏览与基础模拟容量。";
  }
  if (plan.tier === "pro") {
    return "适合持续跟踪策略与信号。";
  }
  return "更高配额与深度分析能力。";
}

function trimPrice(value: string) {
  return value.replace(/\.00$/, "");
}
