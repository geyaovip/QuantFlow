"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { NotificationPreference } from "@quantflow/contracts";

import { resolveApiBaseUrl } from "../lib/api-base-url";

const labels: Record<NotificationPreference["type"], string> = {
  system: "系统公告",
  signal: "策略信号",
  risk: "风险提醒",
  membership: "会员状态",
};

type NotificationPreferencesFormProps = {
  preferences: NotificationPreference[];
};

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const router = useRouter();
  const [items, setItems] = useState(preferences);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = (type: NotificationPreference["type"]) => {
    setItems((current) =>
      current.map((item) =>
        item.type === type ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const save = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${resolveApiBaseUrl()}/api/v1/notification-preferences`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ preferences: items }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "保存失败");
      }
      setMessage("通知偏好已保存。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="notification-preferences">
      {items.map((item) => (
        <label className="membership-risk-check" key={item.type}>
          <input
            checked={item.enabled}
            onChange={() => toggle(item.type)}
            type="checkbox"
          />
          <span>{labels[item.type]}（站内）</span>
        </label>
      ))}
      <button disabled={isSubmitting} onClick={() => void save()} type="button">
        {isSubmitting ? "保存中..." : "保存偏好"}
      </button>
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
