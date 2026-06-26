import Link from "next/link";

import { PageHeader } from "@quantflow/ui";

import { LogoutButton } from "../../../components/auth/logout-button";
import { getUserSession } from "../../../lib/auth-session";
import { resolveApiBaseUrl } from "../../../lib/api-base-url";
import { getMembershipEntitlements } from "../../../lib/membership-api";
import { getMyStrategies, getSecurityEvents } from "../../../lib/strategy-api";
import { formatSecurityEvent } from "../../../lib/security-format";

export const dynamic = "force-dynamic";

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
  const entitlements = session
    ? await getMembershipEntitlements().catch(() => null)
    : null;
  const securityEvents = session
    ? await getSecurityEvents().catch(() => null)
    : null;
  const activeCount = subscriptions?.pagination.total ?? 0;
  const subscriptionLimit = entitlements?.strategySubscriptionsMax ?? 3;

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="个人中心"
        title="我的 QuantFlow"
        description="查看邮箱登录状态、访问权益、订阅配额和安全记录。用户端与管理端统一使用邮箱验证码登录。"
      />
      {session ? (
        <div className="profile-panel">
          <div className="app-kpi-grid" aria-label="账户概览">
            <div>
              <span>当前计划</span>
              <strong>
                {entitlements?.planName ?? session.membershipPlan ?? "Free"}
              </strong>
            </div>
            <div>
              <span>策略订阅</span>
              <strong>
                {activeCount} / {subscriptionLimit}
              </strong>
            </div>
            <div>
              <span>模拟盘容量</span>
              <strong>{entitlements?.paperAccountsMax ?? 1} 个</strong>
            </div>
          </div>
          <section className="profile-panel__section">
            <h2>账户状态</h2>
            <strong>{session.displayName ?? "QuantFlow 用户"}</strong>
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
              {entitlements?.planName ?? "Free"} 计划最多订阅{" "}
              {subscriptionLimit} 个活跃策略。你已订阅 {activeCount} 个，剩余{" "}
              {Math.max(subscriptionLimit - activeCount, 0)} 个。
            </p>
            <div className="profile-panel__links">
              <Link className="secondary-link" href="/app/my-strategies">
                查看我的策略
              </Link>
              <Link className="secondary-link" href="/app/membership">
                查看会员权益
              </Link>
            </div>
          </section>
          <section className="profile-panel__section">
            <h2>最近安全记录</h2>
            {securityEvents?.data.length ? (
              <ul className="security-event-list">
                {securityEvents.data.map((event) => (
                  <li key={event.id}>
                    <strong>{formatSecurityEvent(event.eventType)}</strong>
                    <span>
                      {new Date(event.occurredAt).toLocaleString("zh-CN")}
                      {event.ip ? ` · ${event.ip}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>登录、验证码和会话相关事件会显示在这里。</p>
            )}
          </section>
          <section className="profile-panel__section">
            <h2>通知与边界</h2>
            <p>
              可在{" "}
              <Link className="secondary-link" href="/app/notifications">
                通知中心
              </Link>{" "}
              查看站内提醒，或在{" "}
              <Link
                className="secondary-link"
                href="/app/notifications/preferences"
              >
                通知偏好
              </Link>{" "}
              中管理提醒类型。会员支付仅开通功能容量，不提供自动续费或真实下单入口。
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
