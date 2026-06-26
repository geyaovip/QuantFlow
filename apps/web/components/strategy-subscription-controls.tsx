"use client";

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
        throw new Error("subscription failed");
      }

      setSubscribed(!subscribed);
      setMessage(subscribed ? "已取消订阅。" : "已订阅策略信号。");
    } catch {
      setError("操作失败，请稍后重试。Free 计划最多订阅 3 个策略。");
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
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
