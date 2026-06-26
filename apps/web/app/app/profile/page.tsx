import Link from "next/link";

import { PageHeader } from "@quantflow/ui";

import { LogoutButton } from "../../../components/auth/logout-button";
import { getUserSession, resolveApiBaseUrl } from "../../../lib/auth-session";
import { getMyStrategies } from "../../../lib/strategy-api";

export const dynamic = "force-dynamic";

const FREE_STRATEGY_SUBSCRIPTION_LIMIT = 3;

function formatSessionExpiry(expiresAt: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(expiresAt));
}

export default async function ProfilePage() {
  const session = await getUserSession();
  const subscriptions = session
    ? await getMyStrategies().catch(() => null)
    : null;
  const activeCount = subscriptions?.pagination.total ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="个人中心"
        title="我的 QuantFlow"
        description="查看邮箱登录状态、访问权益、通知偏好和安全记录。用户端与管理端统一使用邮箱验证码登录。"
      />
      {session ? (
        <div className="profile-panel">
          <section className="profile-panel__section">
            <strong>{session.displayName ?? "你已登录"}</strong>
            <p>
              {session.email ? `${session.email} · ` : ""}
              当前会话有效，将于 {formatSessionExpiry(session.expiresAt)} 到期。
              {session.membershipPlan
                ? ` 当前计划：${session.membershipPlan}。`
                : " 当前计划：Free。"}
            </p>
            <LogoutButton
              apiBaseUrl={resolveApiBaseUrl()}
              redirectTo="/login?next=/app/profile"
            />
          </section>
          <section className="profile-panel__section">
            <h2>策略订阅配额</h2>
            <p>
              Free 计划最多订阅 {FREE_STRATEGY_SUBSCRIPTION_LIMIT}{" "}
              个活跃策略。你已订阅 {activeCount} 个，剩余{" "}
              {Math.max(FREE_STRATEGY_SUBSCRIPTION_LIMIT - activeCount, 0)} 个。
            </p>
            <Link className="secondary-link" href="/app/my-strategies">
              查看我的策略
            </Link>
          </section>
          <section className="profile-panel__section">
            <h2>待接入能力</h2>
            <p>
              模拟盘容量、通知偏好和安全事件记录将在后续版本接入。当前版本不包含在线购买或自动续费。
            </p>
          </section>
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
