"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminAnnouncement } from "@quantflow/contracts";

type AdminAnnouncementsConsoleProps = {
  apiBaseUrl: string;
  announcements: AdminAnnouncement[];
};

export function AdminAnnouncementsConsole({
  apiBaseUrl,
  announcements,
}: AdminAnnouncementsConsoleProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createAnnouncement = async () => {
    const reason = window.prompt("请输入创建原因");
    if (!reason || reason.length < 3) {
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError("请填写标题和正文");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/announcements`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content, reason }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "创建失败");
      }
      setTitle("");
      setContent("");
      setMessage("公告草稿已创建。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const publishAnnouncement = async (announcementId: string) => {
    const reason = window.prompt("请输入发布原因");
    if (!reason || reason.length < 3) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/announcements/${announcementId}/publish`,
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
        throw new Error(payload?.message ?? "发布失败");
      }
      setMessage("公告已发布，并向全部用户发送系统通知。");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "发布失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-console">
      <div className="admin-form-row">
        <label>
          标题
          <input
            disabled={isSubmitting}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label>
          正文
          <textarea
            disabled={isSubmitting}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            value={content}
          />
        </label>
        <button
          disabled={isSubmitting}
          onClick={() => void createAnnouncement()}
          type="button"
        >
          创建草稿
        </button>
      </div>
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {announcements.length ? (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>标题</span>
            <span>状态</span>
            <span>发布时间</span>
            <span>操作</span>
          </div>
          {announcements.map((announcement) => (
            <div className="admin-table__row" key={announcement.id}>
              <span>{announcement.title}</span>
              <span>{announcement.status}</span>
              <span>
                {announcement.publishedAt
                  ? new Date(announcement.publishedAt).toLocaleString("zh-CN")
                  : "—"}
              </span>
              <span className="admin-table__actions">
                {announcement.status === "draft" ? (
                  <button
                    disabled={isSubmitting}
                    onClick={() => void publishAnnouncement(announcement.id)}
                    type="button"
                  >
                    发布
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
          <strong>暂无系统公告</strong>
          <span>创建草稿并发布后，会向全部活跃用户发送站内系统通知。</span>
        </div>
      )}
    </div>
  );
}
