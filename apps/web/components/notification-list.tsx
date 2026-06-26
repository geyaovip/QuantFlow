"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { resolveApiBaseUrl } from "../lib/api-base-url";
import { formatDateTime } from "../lib/strategy-format";

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationListProps = {
  notifications: NotificationItem[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const markRead = async (notificationId: string) => {
    setIsSubmitting(notificationId);
    try {
      const response = await fetch(
        `${resolveApiBaseUrl()}/api/v1/notifications/${notificationId}`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("标记已读失败");
      }
      router.refresh();
    } finally {
      setIsSubmitting(null);
    }
  };

  if (!notifications.length) {
    return <p className="paper-detail-empty">暂无通知。</p>;
  }

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <article
          className={
            notification.readAt
              ? "notification-item notification-item--read"
              : "notification-item"
          }
          key={notification.id}
        >
          <div>
            <strong>{notification.title}</strong>
            <p>{notification.content}</p>
            <small>{formatDateTime(notification.createdAt)}</small>
          </div>
          {!notification.readAt ? (
            <button
              disabled={isSubmitting === notification.id}
              onClick={() => void markRead(notification.id)}
              type="button"
            >
              标记已读
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
