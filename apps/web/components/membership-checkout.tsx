"use client";

import { useState } from "react";

import type { MembershipPlan, MembershipTier } from "@quantflow/contracts";
import { Button, Card } from "@quantflow/ui";

type PaidTier = Extract<MembershipTier, "plus" | "pro">;

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
  const [selectedTier, setSelectedTier] = useState<PaidTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedPlan = selectedTier
    ? plans.find((plan) => plan.tier === selectedTier)
    : null;

  function openCheckout(plan: MembershipPlan) {
    if (plan.tier !== "plus" && plan.tier !== "pro") {
      return;
    }
    setSelectedTier(plan.tier);
    setError(null);
  }

  function closeCheckout() {
    if (loading) {
      return;
    }
    setSelectedTier(null);
    setError(null);
  }

  async function handleCheckout() {
    if (!selectedTier) {
      setError("请先选择会员计划。");
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

      const result = (await response.json().catch(() => null)) as {
        data?: { invoiceUrl?: string };
        message?: string;
      } | null;
      if (!response.ok || !result?.data?.invoiceUrl) {
        throw new Error(result?.message ?? "支付订单创建失败，请稍后重试。");
      }

      window.location.href = result.data.invoiceUrl;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "支付订单创建失败，请稍后重试。",
      );
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
              ? plan.monthlyPriceUsd
              : plan.yearlyPriceUsd;
          const isCurrent = plan.tier === currentTier;
          const canSelect = plan.tier === "plus" || plan.tier === "pro";

          return (
            <Card
              className={
                isCurrent
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
                  <span className="membership-card__currency">$</span>
                  <span>{trimPrice(price)}</span>
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
                  variant={canSelect ? "secondary" : "primary"}
                  onClick={() => openCheckout(plan)}
                >
                  选择 {plan.name}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      {selectedPlan ? (
        <div
          aria-labelledby="membership-checkout-title"
          aria-modal="true"
          className="membership-modal"
          role="dialog"
        >
          <div className="membership-modal__backdrop" onClick={closeCheckout} />
          <Card className="membership-modal__dialog">
            <div className="membership-modal__header">
              <div>
                <span>支付确认</span>
                <h2 id="membership-checkout-title">
                  {selectedPlan.name} ·{" "}
                  {billingCycle === "monthly" ? "月付" : "年付"}
                </h2>
              </div>
              <strong>
                $
                {trimPrice(
                  billingCycle === "monthly"
                    ? selectedPlan.monthlyPriceUsd
                    : selectedPlan.yearlyPriceUsd,
                )}
              </strong>
            </div>
            <p>
              确认后将打开 Plisio
              支付页。支付完成后，系统会根据支付回调自动开通会员容量。
            </p>
            {error ? <p className="auth-error">{error}</p> : null}
            <div className="membership-modal__actions">
              <Button disabled={loading} onClick={handleCheckout}>
                {loading ? "正在创建支付订单..." : "确认并支付"}
              </Button>
              <Button
                disabled={loading}
                onClick={closeCheckout}
                type="button"
                variant="secondary"
              >
                取消
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
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

function trimPrice(value: string) {
  return value.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
