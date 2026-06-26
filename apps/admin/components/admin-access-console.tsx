"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AdminAccountListItem,
  AdminRoleListItem,
} from "@quantflow/contracts";

type AdminAccessConsoleProps = {
  apiBaseUrl: string;
  roles: AdminRoleListItem[];
  accounts: AdminAccountListItem[];
};

export function AdminAccessConsole({
  apiBaseUrl,
  roles,
  accounts,
}: AdminAccessConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignRole = async (adminUserId: string, roleId: string) => {
    const reason = window.prompt("请输入授权原因");
    if (!reason) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/admin-users/${adminUserId}/roles`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roleId, reason }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "操作失败");
      }
      setMessage("管理员角色已更新。");
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
      <section className="admin-table-card">
        <h2>角色定义</h2>
        <div className="admin-table">
          {roles.map((role) => (
            <div className="admin-table__row" key={role.id}>
              <span>
                <strong>{role.name}</strong>
                <small>{role.description}</small>
              </span>
              <span>{role.permissions.join(" · ")}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-table-card">
        <h2>管理员账号</h2>
        <div className="admin-table">
          <div className="admin-table__head">
            <span>邮箱</span>
            <span>状态</span>
            <span>当前角色</span>
            <span>授权</span>
          </div>
          {accounts.map((account) => (
            <div className="admin-table__row" key={account.id}>
              <span>{account.email}</span>
              <span>{account.status}</span>
              <span>{account.roles.join(", ") || "无"}</span>
              <span className="admin-table__actions">
                {roles.map((role) => (
                  <button
                    disabled={isSubmitting || account.roles.includes(role.name)}
                    key={role.id}
                    onClick={() => void assignRole(account.id, role.id)}
                    type="button"
                  >
                    {role.name}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
