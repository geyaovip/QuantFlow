"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@quantflow/ui";

type LogoutButtonProps = {
  apiBaseUrl: string;
  children?: ReactNode;
  className?: string;
  menuItem?: boolean;
  redirectTo?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function LogoutButton({
  apiBaseUrl,
  children = "退出登录",
  className,
  menuItem = false,
  redirectTo,
  variant = "secondary",
}: LogoutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("logout failed");
      }

      window.location.assign(redirectTo ?? window.location.pathname);
    } catch {
      setError("退出失败，请稍后重试。");
      setIsSubmitting(false);
    }
  };

  if (menuItem) {
    return (
      <div className="logout-button">
        <button
          className={className ?? "app-user-menu__item"}
          disabled={isSubmitting}
          onClick={() => void handleLogout()}
          type="button"
        >
          {isSubmitting ? "正在退出..." : children}
        </button>
        {error ? <p className="auth-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="logout-button">
      <Button
        className={className}
        disabled={isSubmitting}
        onClick={() => void handleLogout()}
        type="button"
        variant={variant}
      >
        {isSubmitting ? "正在退出..." : children}
      </Button>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
