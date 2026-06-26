import Link from "next/link";

import { PageHeader } from "@quantflow/ui";

import { getUserSession } from "../../../lib/auth-session";

export const dynamic = "force-dynamic";

function formatSessionExpiry(expiresAt: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(expiresAt));
}

export default async function ProfilePage() {
  const session = await getUserSession();

  return (
    <div>
      <PageHeader
        eyebrow="个人中心"
        title="我的 QuantFlow"
        description="查看邮箱登录状态、访问权益、通知偏好和安全记录。用户端与管理端统一使用邮箱验证码登录。"
      />
      {session ? (
        <div className="empty-state">
          <strong>你已登录</strong>
          <p>
            当前会话有效，将于 {formatSessionExpiry(session.expiresAt)} 到期。
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <strong>尚未登录</strong>
          <p>登录后可查看访问权益、模拟盘容量、最近安全事件和通知设置。</p>
          <Link className="primary-link" href="/login?next=/app/profile">
            去登录
          </Link>
        </div>
      )}
    </div>
  );
}
