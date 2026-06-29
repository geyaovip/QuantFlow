"use client";

import { useState } from "react";

import type { MembershipPlan, MembershipTier } from "@quantflow/contracts";
import { Button, Card } from "@quantflow/ui";

const RISK_DISCLOSURE =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

type MembershipCheckoutProps = {
  apiBaseUrl: string;
  currentTier: MembershipTier;
  plans: MembershipPlan[];
};

export function MembershipCheckout({
  apiBaseUrl,
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
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!selectedTier || !accepted) {
      setError("请先选择计划并确认风险提示。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/membership/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tier: selectedTier,
          billingCycle,
          riskAccepted: true,
        }),
      });

      if (!response.ok) {
        throw new Error("checkout failed");
      }

      const result = await response.json();
      window.location.href = result.data.invoiceUrl;
    } catch {
      setError("支付订单创建失败，请稍后重试。");
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
          aria-pressed={billingCycle === "monthly"}
          className={
            billingCycle === "monthly" ? "filter-chip is-active" : "filter-chip"
          }
          onClick={() => setBillingCycle("monthly")}
          type="button"
        >
          月付
        </button>
        <button
          aria-pressed={billingCycle === "yearly"}
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
          const isSelected = selectedTier === plan.tier;
          const canSelect = plan.tier === "pro" || plan.tier === "premium";

          return (
            <Card
              className={
                isCurrent || isSelected
                  ? "membership-card membership-card--active"
                  : "membership-card"
              }
              key={plan.tier}
            >
              <div className="membership-card__header">
                <div className="membership-card__title-row">
                  <strong>{plan.name}</strong>
                  {isCurrent ? (
                    <span className="membership-card__badge">当前计划</span>
                  ) : null}
                </div>
                <div className="membership-card__price">
                  <span className="membership-card__currency">¥</span>
                  <span>{price}</span>
                  {plan.tier === "free" ? null : (
                    <span className="membership-card__period">
                      /{billingCycle === "monthly" ? "月" : "年"}
                    </span>
                  )}
                </div>
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
                  aria-pressed={isSelected}
                  variant={isSelected ? "primary" : "secondary"}
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
        <h2>支付确认</h2>
        <p>
          选择计划并确认风险提示后进入支付页。支付成功后系统会自动开通会员权益。
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
        <Button
          disabled={loading || !selectedTier || !accepted}
          onClick={handleCheckout}
        >
          {loading ? "正在创建支付订单..." : "确认并去支付"}
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
