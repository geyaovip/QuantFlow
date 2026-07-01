"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [activeInvoiceUrl, setActiveInvoiceUrl] = useState<string | null>(null);
  const selectedPlan = selectedTier
    ? plans.find((plan) => plan.tier === selectedTier)
    : null;
  const selectedPrice = selectedPlan
    ? billingCycle === "monthly"
      ? selectedPlan.monthlyPriceUsd
      : selectedPlan.yearlyPriceUsd
    : "0";
  const selectedEntitlements = useMemo(
    () =>
      selectedPlan
        ? Object.fromEntries(
            selectedPlan.entitlements.map((item) => [item.key, item.value]),
          )
        : {},
    [selectedPlan],
  );

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCheckout();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, selectedPlan]);

  function openCheckout(plan: MembershipPlan) {
    if (plan.tier !== "plus" && plan.tier !== "pro") {
      return;
    }
    setSelectedTier(plan.tier);
    setError(null);
    setCheckoutMessage(null);
    setActiveInvoiceUrl(null);
  }

  function closeCheckout() {
    if (loading) {
      return;
    }
    setSelectedTier(null);
    setError(null);
    setCheckoutMessage(null);
    setActiveInvoiceUrl(null);
  }

  function openPaymentPage(invoiceUrl: string) {
    const paymentWindow = window.open(invoiceUrl, "_blank", "noopener");
    if (!paymentWindow) {
      setCheckoutMessage("浏览器拦截了新标签页，请点击下方链接继续支付。");
      return false;
    }

    setCheckoutMessage(
      "支付页已在新标签打开。完成或取消支付后，可回到本页面查看状态。",
    );
    return true;
  }

  async function handleCheckout() {
    if (!selectedTier) {
      setError("请先选择会员计划。");
      return;
    }
    if (loading) {
      return;
    }
    if (activeInvoiceUrl) {
      openPaymentPage(activeInvoiceUrl);
      return;
    }

    setLoading(true);
    setError(null);
    setCheckoutMessage(null);

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

      setActiveInvoiceUrl(result.data.invoiceUrl);
      openPaymentPage(result.data.invoiceUrl);
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
                <span>会员开通</span>
                <h2 id="membership-checkout-title">
                  确认开通 {selectedPlan.name}
                </h2>
              </div>
              <button
                aria-label="关闭支付确认"
                className="membership-modal__close"
                disabled={loading}
                onClick={closeCheckout}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="membership-modal__summary">
              <div>
                <span>{billingCycle === "monthly" ? "月付" : "年付"}</span>
                <strong>${trimPrice(selectedPrice)}</strong>
              </div>
              <p>
                确认后会为当前计划创建一笔支付订单，并在新标签页打开支付页面。支付成功后自动开通会员容量，不自动续费。
              </p>
            </div>
            <div className="membership-modal__methods">
              <span>支持方式</span>
              <div>
                <strong>USDT BEP-20</strong>
                <strong>USDT ERC-20</strong>
              </div>
            </div>
            <div className="membership-modal__benefits">
              <div>
                <span>策略订阅</span>
                <strong>
                  {selectedEntitlements.strategy_subscriptions_max ?? "—"} 个
                </strong>
              </div>
              <div>
                <span>模拟盘</span>
                <strong>
                  {selectedEntitlements.paper_accounts_max ?? "—"} 个
                </strong>
              </div>
              <div>
                <span>历史数据</span>
                <strong>{selectedEntitlements.history_days ?? "—"} 天</strong>
              </div>
            </div>
            {error ? (
              <p className="membership-modal__error" role="alert">
                {error}
              </p>
            ) : null}
            {checkoutMessage ? (
              <p className="membership-modal__message" role="status">
                {checkoutMessage}
              </p>
            ) : null}
            {activeInvoiceUrl ? (
              <a
                className="membership-modal__payment-link"
                href={activeInvoiceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                继续支付
              </a>
            ) : null}
            <div className="membership-modal__actions">
              <Button disabled={loading} onClick={handleCheckout}>
                {loading
                  ? "正在创建订单..."
                  : activeInvoiceUrl
                    ? "重新打开支付页"
                    : "确认并支付"}
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
