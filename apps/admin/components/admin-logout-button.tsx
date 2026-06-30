"use client";

import { useState } from "react";

type AdminLogoutButtonProps = {
  apiBaseUrl: string;
};

export function AdminLogoutButton({ apiBaseUrl }: AdminLogoutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logout = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/login");
    }
  };

  return (
    <button
      className="admin-sidebar__logout"
      disabled={isSubmitting}
      onClick={() => void logout()}
      type="button"
    >
      {isSubmitting ? "退出中..." : "退出登录"}
    </button>
  );
}
