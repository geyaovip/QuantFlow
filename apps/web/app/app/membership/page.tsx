import { Card, PageHeader } from "@quantflow/ui";

import { MembershipCheckout } from "../../../components/membership-checkout";
import {
  getMembershipEntitlements,
  getMembershipPlans,
  resolveMembershipApiBaseUrl,
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
      <section className="app-hero-panel" aria-label="会员权益概览">
        <Card className="app-hero-card">
          <h2>会员只影响功能容量，不影响策略结果</h2>
          <p>
            Pro 和 Premium
            提供更多策略订阅、模拟盘容量和历史数据访问，不代表更高收益，也不降低市场风险。
          </p>
        </Card>
        <div className="app-kpi-grid" aria-label="当前权益">
          <div>
            <span>当前计划</span>
            <strong>{entitlements.planName}</strong>
          </div>
          <div>
            <span>策略订阅</span>
            <strong>{entitlements.strategySubscriptionsMax} 个</strong>
          </div>
          <div>
            <span>历史数据</span>
            <strong>{entitlements.historyDays} 天</strong>
          </div>
        </div>
      </section>
      <MembershipCheckout
        apiBaseUrl={resolveMembershipApiBaseUrl()}
        currentTier={entitlements.tier}
        plans={plans.data}
      />
    </>
  );
}
