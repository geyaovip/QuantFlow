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
  const [grantUserId, setGrantUserId] = useState(users[0]?.id ?? "");
  const [grantTier, setGrantTier] = useState<"pro" | "premium">("pro");
  const [grantCycle, setGrantCycle] = useState<"monthly" | "yearly">("monthly");

  const manualGrant = async () => {
    const reason = window.prompt("请输入人工开通原因");
    if (!reason || reason.length < 3) {
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
            reason,
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
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "开通失败");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="admin-form-row">
        <label>
          人工开通会员
          <select
            disabled={isSubmitting}
            onChange={(event) => setGrantUserId(event.target.value)}
            value={grantUserId}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </label>
        <label>
          档位
          <select
            disabled={isSubmitting}
            onChange={(event) =>
              setGrantTier(event.target.value as "pro" | "premium")
            }
            value={grantTier}
          >
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
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
        <button
          disabled={isSubmitting || !users.length}
          onClick={() => void manualGrant()}
          type="button"
        >
          开通
        </button>
      </div>
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
    </div>
  );
}
