"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@quantflow/ui";

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

  const submit = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/strategies/${strategyId}/subscriptions${subscribed ? "/current" : ""}`,
        {
          method: subscribed ? "DELETE" : "POST",
          credentials: "include",
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
