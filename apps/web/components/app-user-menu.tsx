"use client";

import { CircleUserRound, LogOut, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import type { UserSession } from "../lib/auth-session";
import { getAvatarInitials } from "../lib/user-display";
import { LogoutButton } from "./auth/logout-button";

type AppUserMenuProps = {
  apiBaseUrl: string;
  session: UserSession | null;
};

export function AppUserMenu({ apiBaseUrl, session }: AppUserMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!session) {
    return (
      <Link className="app-sidebar__login" href="/login?next=/app/strategies">
        登录
      </Link>
    );
  }

  const displayName = session.displayName ?? "QuantFlow 用户";
  const membershipPlan = session.membershipPlan ?? "Free";

  return (
    <div className="app-user-menu" ref={rootRef}>
      {open ? (
        <div
          aria-labelledby={`${menuId}-trigger`}
          className="app-user-menu__popover"
          role="menu"
        >
          <div className="app-user-menu__popover-header">
            <strong>{displayName}</strong>
            {session.email ? <span>{session.email}</span> : null}
          </div>
          <Link
            className="app-user-menu__item"
            href="/app/membership"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            会员权益
          </Link>
          <Link
            className="app-user-menu__item"
            href="/app/profile"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <CircleUserRound aria-hidden="true" size={16} />
            个人中心
          </Link>
          <div className="app-user-menu__logout" role="none">
            <LogoutButton
              apiBaseUrl={apiBaseUrl}
              menuItem
              redirectTo="/login?next=/app/strategies"
            >
              <span className="app-user-menu__logout-label">
                <LogOut aria-hidden="true" size={16} />
                退出登录
              </span>
            </LogoutButton>
          </div>
        </div>
      ) : null}
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className="app-user-menu__trigger"
        id={`${menuId}-trigger`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true" className="app-user-avatar">
          {getAvatarInitials(displayName)}
        </span>
        <span className="app-user-menu__meta">
          <strong>{displayName}</strong>
          <span>{membershipPlan}</span>
        </span>
        <MoreHorizontal
          aria-hidden="true"
          className="app-user-menu__more"
          size={18}
        />
      </button>
    </div>
  );
}
