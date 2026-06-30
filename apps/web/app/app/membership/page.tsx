import { Card, PageHeader } from "@quantflow/ui";

import { MembershipCheckout } from "../../../components/membership-checkout";
import { MembershipInviteRedeem } from "../../../components/membership-invite-redeem";
import {
  getMembershipEntitlements,
  getMembershipPlans,
  resolveMembershipApiBaseUrl,
} from "../../../lib/membership-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "会员权益" };

export default async function MembershipPage({
  searchParams,
}: {
  searchParams?: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;
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
        title="会员权益"
        description={`当前计划：${entitlements.planName}，可订阅 ${entitlements.strategySubscriptionsMax} 个策略，创建 ${entitlements.paperAccountsMax} 个模拟盘。`}
      />
      <section className="app-hero-panel" aria-label="会员权益概览">
        <Card className="app-hero-card">
          <h2>升级容量，不承诺收益</h2>
          <p>
            Plus 和 Pro
            提供更多策略订阅、模拟盘和历史数据容量。支付只开通功能权益，不改变策略风险。
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
            <span>模拟盘</span>
            <strong>{entitlements.paperAccountsMax} 个</strong>
          </div>
          <div>
            <span>历史数据</span>
            <strong>{entitlements.historyDays} 天</strong>
          </div>
        </div>
      </section>
      {params?.payment === "success" ? (
        <Card className="membership-status-card">
          <strong>支付结果确认中</strong>
          <p>
            已返回
            QuantFlow。会员开通以后端收到支付成功回调为准，通常会在短时间内自动刷新。
          </p>
        </Card>
      ) : null}
      {params?.payment === "failed" ? (
        <Card className="membership-status-card membership-status-card--warning">
          <strong>支付未完成</strong>
          <p>订单未完成或已取消。你可以重新选择计划并发起支付。</p>
        </Card>
      ) : null}
      <MembershipCheckout
        apiBaseUrl={resolveMembershipApiBaseUrl()}
        currentTier={entitlements.tier}
        plans={plans.data}
      />
      <MembershipInviteRedeem apiBaseUrl={resolveMembershipApiBaseUrl()} />
    </>
  );
}
