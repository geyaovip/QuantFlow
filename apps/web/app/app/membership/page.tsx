import { PageHeader } from "@quantflow/ui";

import { MembershipCheckout } from "../../../components/membership-checkout";
import {
  getMembershipEntitlements,
  getMembershipPlans,
} from "../../../lib/membership-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "会员权益" };

export default async function MembershipPage() {
  const [plans, entitlements] = await Promise.all([
    getMembershipPlans(),
    getMembershipEntitlements().catch(() => ({
      tier: "free" as const,
      planName: "Free",
      strategySubscriptionsMax: 3,
      paperAccountsMax: 1,
      historyDays: 30,
    })),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="会员权益"
        title="按容量开放，不售卖预期收益"
        description={`当前计划：${entitlements.planName}。可订阅 ${entitlements.strategySubscriptionsMax} 个策略，创建 ${entitlements.paperAccountsMax} 个模拟盘。`}
      />
      <MembershipCheckout currentTier={entitlements.tier} plans={plans.data} />
    </>
  );
}
