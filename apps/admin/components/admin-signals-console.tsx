"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SignalListItem } from "@quantflow/contracts";

type AdminSignalsConsoleProps = {
  apiBaseUrl: string;
  signals: SignalListItem[];
};

export function AdminSignalsConsole({
  apiBaseUrl,
  signals,
}: AdminSignalsConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAction = async (
    signalId: string,
    action: "cancel" | "mark-abnormal" | "repush",
  ) => {
    const reason = window.prompt("请输入操作原因");
    if (!reason) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/signals/${signalId}/${action}`,
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
      setMessage("信号状态已更新。");
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
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>策略</th>
              <th>币种</th>
              <th>方向</th>
              <th>状态</th>
              <th>风险</th>
              <th>生成时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr key={signal.id}>
                <td>{signal.strategyName}</td>
                <td>{signal.symbol}</td>
                <td>{signal.direction}</td>
                <td>{signal.status}</td>
                <td>{signal.riskLevel}</td>
                <td>{new Date(signal.generatedAt).toLocaleString("zh-CN")}</td>
                <td>
                  {signal.status === "active" ? (
                    <>
                      <button
                        disabled={isSubmitting}
                        onClick={() => void runAction(signal.id, "cancel")}
                        type="button"
                      >
                        取消
                      </button>{" "}
                      <button
                        disabled={isSubmitting}
                        onClick={() =>
                          void runAction(signal.id, "mark-abnormal")
                        }
                        type="button"
                      >
                        标记异常
                      </button>{" "}
                      <button
                        disabled={isSubmitting}
                        onClick={() => void runAction(signal.id, "repush")}
                        type="button"
                      >
                        重新推送
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={isSubmitting}
                      onClick={() => void runAction(signal.id, "repush")}
                      type="button"
                    >
                      重新推送
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
