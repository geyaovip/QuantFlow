"use client";

import { useState } from "react";

import type { MembershipPlan, MembershipTier } from "@quantflow/contracts";
import { Button, Card } from "@quantflow/ui";

import { mockCheckoutMembership } from "../lib/membership-api";

const RISK_DISCLOSURE =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

type MembershipCheckoutProps = {
  currentTier: MembershipTier;
  plans: MembershipPlan[];
};

export function MembershipCheckout({
  currentTier,
  plans,
}: MembershipCheckoutProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [selectedTier, setSelectedTier] = useState<"pro" | "premium" | null>(
    null,
  );
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!selectedTier || !accepted) {
      setError("请先选择计划并确认风险提示。");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await mockCheckoutMembership({
        tier: selectedTier,
        billingCycle,
        riskAccepted: true,
      });
      setMessage(
        `已模拟开通 ${result.data.planName}，有效期至 ${new Date(result.data.endsAt).toLocaleString("zh-CN")}。未产生真实扣款。`,
      );
      window.location.reload();
    } catch {
      setError("模拟开通失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="membership-layout">
      <div
        className="membership-billing-toggle"
        role="group"
        aria-label="计费周期"
      >
        <button
          className={
            billingCycle === "monthly" ? "filter-chip is-active" : "filter-chip"
          }
          onClick={() => setBillingCycle("monthly")}
          type="button"
        >
          月付
        </button>
        <button
          className={
            billingCycle === "yearly" ? "filter-chip is-active" : "filter-chip"
          }
          onClick={() => setBillingCycle("yearly")}
          type="button"
        >
          年付
        </button>
      </div>
      <div className="membership-grid">
        {plans.map((plan) => {
          const price =
            billingCycle === "monthly"
              ? plan.monthlyPriceCny
              : plan.yearlyPriceCny;
          const isCurrent = plan.tier === currentTier;
          const canSelect = plan.tier === "pro" || plan.tier === "premium";

          return (
            <Card className="membership-card" key={plan.tier}>
              <div className="membership-card__header">
                <strong>{plan.name}</strong>
                <span>
                  ¥{price}
                  {plan.tier === "free"
                    ? ""
                    : billingCycle === "monthly"
                      ? "/月"
                      : "/年"}
                </span>
              </div>
              <ul>
                {plan.entitlements.map((item) => (
                  <li key={item.key}>
                    {formatEntitlement(item.key, item.value)}
                  </li>
                ))}
              </ul>
              {plan.tier === "free" ? (
                <p className="membership-card__note">默认计划，无需开通。</p>
              ) : isCurrent ? (
                <p className="membership-card__note">当前计划</p>
              ) : (
                <Button
                  disabled={!canSelect}
                  variant={selectedTier === plan.tier ? "primary" : "secondary"}
                  onClick={() =>
                    setSelectedTier(plan.tier as "pro" | "premium")
                  }
                >
                  选择 {plan.name}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      <Card className="membership-checkout-panel">
        <h2>模拟开通确认</h2>
        <p>
          当前为内测模拟开通流程，不会连接真实支付渠道，也不会产生扣款或自动续费。后续接入真实付费时将替换本流程。
        </p>
        <label className="membership-risk-check">
          <input
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            type="checkbox"
          />
          <span>{RISK_DISCLOSURE}</span>
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        {message ? <p className="auth-message">{message}</p> : null}
        <Button disabled={loading} onClick={handleCheckout}>
          {loading ? "处理中..." : "确认模拟开通"}
        </Button>
      </Card>
    </div>
  );
}

function formatEntitlement(key: string, value: string) {
  if (key === "strategy_subscriptions_max") {
    return `最多订阅 ${value} 个策略`;
  }
  if (key === "paper_accounts_max") {
    return `最多 ${value} 个模拟盘`;
  }
  if (key === "history_days") {
    return `历史数据 ${value} 天`;
  }
  return `${key}: ${value}`;
}
