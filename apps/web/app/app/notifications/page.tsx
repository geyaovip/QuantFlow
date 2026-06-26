import Link from "next/link";

import { Card, PageHeader } from "@quantflow/ui";

import { NotificationList } from "../../../components/notification-list";
import { getNotifications } from "../../../lib/notification-api";

export default async function NotificationsPage() {
  const notifications = await getNotifications().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }));

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="通知中心"
        title="站内通知"
        description="这里展示策略、风险、会员和系统相关的站内提醒。QuantFlow 不提供投资建议，不承诺任何收益。"
      />
      <Card className="paper-detail-card">
        <NotificationList notifications={notifications.data} />
      </Card>
      {notifications.pagination.totalPages > 1 ? (
        <p className="section-note">
          第 {notifications.pagination.page} /{" "}
          {notifications.pagination.totalPages} 页，共{" "}
          {notifications.pagination.total} 条通知。
        </p>
      ) : null}
      <Link className="secondary-link" href="/app/notifications/preferences">
        管理通知偏好
      </Link>
    </div>
  );
}
