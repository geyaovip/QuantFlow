"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@quantflow/ui";

const RISK_DISCLOSURE =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

type StrategySubscriptionControlsProps = {
  apiBaseUrl: string;
  isSubscribed: boolean;
  strategyId: string;
};

export function StrategySubscriptionControls({
  apiBaseUrl,
  isSubscribed,
  strategyId,
}: StrategySubscriptionControlsProps) {
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [riskAccepted, setRiskAccepted] = useState(subscribed);

  const submit = async () => {
    if (!subscribed && !riskAccepted) {
      setError("请先确认风险提示");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/strategies/${strategyId}/subscriptions${subscribed ? "/current" : ""}`,
        {
          method: subscribed ? "DELETE" : "POST",
          credentials: "include",
          headers: subscribed
            ? undefined
            : { "content-type": "application/json" },
          body: subscribed
            ? undefined
            : JSON.stringify({
                riskDisclosureVersion: "risk-v1",
                riskAccepted: true,
              }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        if (response.status === 403) {
          throw new Error(
            payload?.message ?? "当前会员计划无法订阅该策略，请升级后重试。",
          );
        }
        throw new Error("subscription failed");
      }

      setSubscribed(!subscribed);
      setMessage(subscribed ? "已取消订阅。" : "已订阅策略信号。");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "操作失败，请稍后重试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="strategy-subscription-controls">
      {!subscribed ? (
        <label className="membership-risk-check">
          <input
            checked={riskAccepted}
            disabled={isSubmitting}
            onChange={(event) => setRiskAccepted(event.target.checked)}
            type="checkbox"
          />
          <span>{RISK_DISCLOSURE}</span>
        </label>
      ) : null}
      <Button
        disabled={isSubmitting}
        onClick={() => void submit()}
        type="button"
      >
        {isSubmitting ? "处理中..." : subscribed ? "取消订阅" : "订阅信号"}
      </Button>
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? (
        <p className="auth-error">
          {error}{" "}
          <Link className="inline-link" href="/app/membership">
            查看会员计划
          </Link>
        </p>
      ) : null}
    </div>
  );
}
