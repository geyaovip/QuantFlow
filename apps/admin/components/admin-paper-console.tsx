"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminPaperAccountListItem } from "@quantflow/contracts";

type AdminPaperConsoleProps = {
  apiBaseUrl: string;
  accounts: AdminPaperAccountListItem[];
};

export function AdminPaperConsole({
  apiBaseUrl,
  accounts,
}: AdminPaperConsoleProps) {
  const router = useRouter();
  const [reason, setReason] = useState("管理端治理操作");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAction = async (
    accountId: string,
    action: "pause" | "resume" | "mark-abnormal",
  ) => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/paper-accounts/${accountId}/${action}`,
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

      setMessage("模拟盘状态已更新。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-console">
      <div className="admin-console__toolbar">
        <label>
          操作原因
          <input
            onChange={(event) => setReason(event.target.value)}
            value={reason}
          />
        </label>
      </div>
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {accounts.length ? (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>名称</span>
            <span>用户</span>
            <span>策略</span>
            <span>状态</span>
            <span>权益（模拟）</span>
            <span>操作</span>
          </div>
          {accounts.map((account) => (
            <div className="admin-table__row" key={account.id}>
              <span>
                <strong>{account.name}</strong>
                <small>{account.symbol}</small>
              </span>
              <span>{account.userEmail}</span>
              <span>{account.strategyName}</span>
              <span>{account.status}</span>
              <span>{account.currentEquity} USDT</span>
              <span className="admin-table__actions">
                <a href={`/admin/paper-accounts/${account.id}`}>查看详情</a>
                {account.status === "running" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void runAction(account.id, "pause")}
                    type="button"
                  >
                    暂停
                  </button>
                ) : null}
                {account.status === "paused" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void runAction(account.id, "resume")}
                    type="button"
                  >
                    恢复
                  </button>
                ) : null}
                {account.status !== "data_error" &&
                account.status !== "ended" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void runAction(account.id, "mark-abnormal")}
                    type="button"
                  >
                    标记异常
                  </button>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <strong>暂无模拟盘记录</strong>
          <span>用户创建模拟盘后会在这里展示权益、回撤与状态。</span>
        </div>
      )}
    </div>
  );
}
