"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminSubscriptionListItem } from "@quantflow/contracts";

type AdminMembershipsConsoleProps = {
  apiBaseUrl: string;
  subscriptions: AdminSubscriptionListItem[];
};

export function AdminMembershipsConsole({
  apiBaseUrl,
  subscriptions,
}: AdminMembershipsConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancelSubscription = async (subscriptionId: string) => {
    const reason = window.prompt("请输入取消原因");
    if (!reason || reason.length < 3) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "取消失败");
      }
      setMessage("订阅已取消。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "取消失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-console">
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {subscriptions.length ? (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>用户</span>
            <span>计划</span>
            <span>来源</span>
            <span>状态</span>
            <span>到期</span>
            <span>操作</span>
          </div>
          {subscriptions.map((subscription) => (
            <div className="admin-table__row" key={subscription.id}>
              <span>{subscription.userEmail}</span>
              <span>
                {subscription.planName} ({subscription.tier})
              </span>
              <span>{subscription.source}</span>
              <span>{subscription.status}</span>
              <span>
                {new Date(subscription.endsAt).toLocaleString("zh-CN")}
              </span>
              <span className="admin-table__actions">
                {subscription.status === "active" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void cancelSubscription(subscription.id)}
                    type="button"
                  >
                    取消
                  </button>
                ) : (
                  <span>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <strong>暂无会员订阅</strong>
          <span>人工开通、测试开通或 Plisio 支付成功后会出现在这里。</span>
        </div>
      )}
    </div>
  );
}
