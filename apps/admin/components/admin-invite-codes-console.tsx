"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminMembershipInviteCode } from "@quantflow/contracts";

type AdminInviteCodesConsoleProps = {
  apiBaseUrl: string;
  inviteCodes: AdminMembershipInviteCode[];
};

export function AdminInviteCodesConsole({
  apiBaseUrl,
  inviteCodes,
}: AdminInviteCodesConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [tier, setTier] = useState<"pro" | "premium">("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [maxRedemptions, setMaxRedemptions] = useState("10");
  const [note, setNote] = useState("");

  const createInviteCode = async () => {
    const reason = window.prompt("请输入创建原因");
    if (!reason || reason.length < 3) {
      return;
    }
    if (!code.trim()) {
      setError("请填写邀请码");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/membership-invite-codes`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code: code.trim(),
            tier,
            billingCycle,
            maxRedemptions: Number(maxRedemptions),
            note: note.trim() || undefined,
            reason,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "创建失败");
      }
      setMessage("邀请码已创建。");
      setCode("");
      setNote("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableInviteCode = async (inviteCodeId: string) => {
    const reason = window.prompt("请输入停用原因");
    if (!reason || reason.length < 3) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/membership-invite-codes/${inviteCodeId}/disable`,
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
        throw new Error(payload?.message ?? "停用失败");
      }
      setMessage("邀请码已停用。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "停用失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-console">
      <section className="admin-form-panel" aria-label="创建邀请码">
        <h2>创建邀请码</h2>
        <div className="admin-form-grid">
          <label>
            <span>邀请码</span>
            <input
              disabled={isSubmitting}
              onChange={(event) => setCode(event.target.value)}
              placeholder="QF-PRO-2026"
              value={code}
            />
          </label>
          <label>
            <span>计划</span>
            <select
              disabled={isSubmitting}
              onChange={(event) =>
                setTier(event.target.value as "pro" | "premium")
              }
              value={tier}
            >
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </label>
          <label>
            <span>周期</span>
            <select
              disabled={isSubmitting}
              onChange={(event) =>
                setBillingCycle(event.target.value as "monthly" | "yearly")
              }
              value={billingCycle}
            >
              <option value="monthly">月付</option>
              <option value="yearly">年付</option>
            </select>
          </label>
          <label>
            <span>可用次数</span>
            <input
              disabled={isSubmitting}
              min={1}
              onChange={(event) => setMaxRedemptions(event.target.value)}
              type="number"
              value={maxRedemptions}
            />
          </label>
          <label>
            <span>备注</span>
            <input
              disabled={isSubmitting}
              onChange={(event) => setNote(event.target.value)}
              value={note}
            />
          </label>
        </div>
        <button
          disabled={isSubmitting}
          onClick={() => void createInviteCode()}
          type="button"
        >
          创建邀请码
        </button>
      </section>
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {inviteCodes.length ? (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>邀请码</span>
            <span>计划</span>
            <span>使用</span>
            <span>状态</span>
            <span>到期</span>
            <span>操作</span>
          </div>
          {inviteCodes.map((item) => (
            <div className="admin-table__row" key={item.id}>
              <span>{item.codeLabel}</span>
              <span>
                {item.tier} / {item.billingCycle === "monthly" ? "月" : "年"}
              </span>
              <span>
                {item.redemptionCount}/{item.maxRedemptions}
              </span>
              <span>{item.status}</span>
              <span>
                {item.expiresAt
                  ? new Date(item.expiresAt).toLocaleString("zh-CN")
                  : "不限"}
              </span>
              <span className="admin-table__actions">
                {item.status === "active" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void disableInviteCode(item.id)}
                    type="button"
                  >
                    停用
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
          <strong>暂无邀请码</strong>
          <span>创建后可分发给内测用户兑换会员。</span>
        </div>
      )}
    </div>
  );
}
