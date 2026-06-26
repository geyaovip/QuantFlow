"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminRiskEvent } from "@quantflow/contracts";

type AdminRiskConsoleProps = {
  apiBaseUrl: string;
  events: AdminRiskEvent[];
};

export function AdminRiskConsole({
  apiBaseUrl,
  events,
}: AdminRiskConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAction = async (
    riskEventId: string,
    action: "assign" | "resolve" | "ignore" | "escalate",
  ) => {
    const reason = window.prompt("请输入处理原因");
    if (!reason) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/risk-events/${riskEventId}/${action}`,
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
        throw new Error(payload?.message ?? "操作失败");
      }
      setMessage("风险事件已更新。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-console">
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {events.length ? (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>类型</span>
            <span>等级</span>
            <span>状态</span>
            <span>说明</span>
            <span>操作</span>
          </div>
          {events.map((event) => (
            <div className="admin-table__row" key={event.id}>
              <span>{event.type}</span>
              <span>{event.level}</span>
              <span>{event.status}</span>
              <span>{event.message}</span>
              <span className="admin-table__actions">
                {event.status === "open" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void runAction(event.id, "assign")}
                    type="button"
                  >
                    接手
                  </button>
                ) : null}
                {event.status !== "resolved" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void runAction(event.id, "resolve")}
                    type="button"
                  >
                    解决
                  </button>
                ) : null}
                {event.status !== "ignored" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void runAction(event.id, "ignore")}
                    type="button"
                  >
                    忽略
                  </button>
                ) : null}
                <button
                  disabled={isSubmitting}
                  onClick={() => void runAction(event.id, "escalate")}
                  type="button"
                >
                  升级
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <strong>暂无待处理风险事件</strong>
          <span>信号异常、策略暂停和模拟盘异常会在这里汇总。</span>
        </div>
      )}
    </div>
  );
}
