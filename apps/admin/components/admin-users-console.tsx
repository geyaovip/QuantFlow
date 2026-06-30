"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminUserListItem } from "@quantflow/contracts";

type AdminUsersConsoleProps = {
  apiBaseUrl: string;
  users: AdminUserListItem[];
};

export function AdminUsersConsole({
  apiBaseUrl,
  users,
}: AdminUsersConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantTier, setGrantTier] = useState<"plus" | "pro">("plus");
  const [grantCycle, setGrantCycle] = useState<"monthly" | "yearly">("monthly");
  const [grantReason, setGrantReason] = useState("");

  const manualGrant = async () => {
    if (!grantReason.trim() || grantReason.trim().length < 3) {
      setError("请填写至少 3 个字的开通原因");
      return;
    }
    if (!grantUserId) {
      setError("请选择用户");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/subscriptions/manual-grant`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userId: grantUserId,
            tier: grantTier,
            billingCycle: grantCycle,
            reason: grantReason.trim(),
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "开通失败");
      }
      setMessage("会员已人工开通。");
      closeGrantModal();
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "开通失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGrantModal = (userId: string) => {
    setGrantUserId(userId);
    setGrantTier("plus");
    setGrantCycle("monthly");
    setGrantReason("");
    setError("");
  };

  const closeGrantModal = () => {
    if (isSubmitting) {
      return;
    }
    setGrantUserId("");
    setGrantReason("");
  };

  const updateStatus = async (
    userId: string,
    status: "active" | "disabled" | "risk_watch",
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
        `${apiBaseUrl}/api/v1/admin/users/${userId}/status`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status, reason }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "操作失败");
      }
      setMessage("用户状态已更新。");
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
      <div className="admin-table">
        <div className="admin-table__head">
          <span>邮箱</span>
          <span>状态</span>
          <span>会员</span>
          <span>模拟盘</span>
          <span>订阅策略</span>
          <span>操作</span>
        </div>
        {users.map((user) => (
          <div className="admin-table__row" key={user.id}>
            <span>{user.email}</span>
            <span>{user.status}</span>
            <span>
              {user.membershipPlanName} ({user.membershipTier})
            </span>
            <span>{user.paperAccountCount}</span>
            <span>{user.strategySubscriptionCount}</span>
            <span className="admin-table__actions">
              <button
                disabled={isSubmitting}
                onClick={() => openGrantModal(user.id)}
                type="button"
              >
                开通会员
              </button>
              {user.status !== "active" ? (
                <button
                  disabled={isSubmitting}
                  onClick={() => void updateStatus(user.id, "active")}
                  type="button"
                >
                  启用
                </button>
              ) : null}
              {user.status !== "disabled" ? (
                <button
                  disabled={isSubmitting}
                  onClick={() => void updateStatus(user.id, "disabled")}
                  type="button"
                >
                  禁用
                </button>
              ) : null}
              {user.status !== "risk_watch" ? (
                <button
                  disabled={isSubmitting}
                  onClick={() => void updateStatus(user.id, "risk_watch")}
                  type="button"
                >
                  风险观察
                </button>
              ) : null}
              <Link
                className="admin-table-link"
                href={`/admin/users/${user.id}`}
              >
                查看详情
              </Link>
            </span>
          </div>
        ))}
      </div>
      {grantUserId ? (
        <div aria-modal="true" className="admin-modal" role="dialog">
          <button
            aria-label="关闭"
            className="admin-modal__backdrop"
            onClick={closeGrantModal}
            type="button"
          />
          <section className="admin-modal__dialog">
            <div className="admin-section-title">
              <div>
                <h2>开通会员</h2>
                <p>
                  {users.find((user) => user.id === grantUserId)?.email ??
                    "当前用户"}
                </p>
              </div>
              <button onClick={closeGrantModal} type="button">
                关闭
              </button>
            </div>
            <div className="admin-form-grid">
              <label>
                档位
                <select
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setGrantTier(event.target.value as "plus" | "pro")
                  }
                  value={grantTier}
                >
                  <option value="plus">Plus</option>
                  <option value="pro">Pro</option>
                </select>
              </label>
              <label>
                周期
                <select
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setGrantCycle(event.target.value as "monthly" | "yearly")
                  }
                  value={grantCycle}
                >
                  <option value="monthly">月付</option>
                  <option value="yearly">年付</option>
                </select>
              </label>
              <label className="admin-form-grid__wide">
                开通原因
                <textarea
                  disabled={isSubmitting}
                  onChange={(event) => setGrantReason(event.target.value)}
                  placeholder="例如：线下付款已核验 / 内测名额开通"
                  value={grantReason}
                />
              </label>
            </div>
            <div className="admin-modal__actions">
              <button
                disabled={isSubmitting}
                onClick={() => void manualGrant()}
                type="button"
              >
                {isSubmitting ? "处理中..." : "确认开通"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
