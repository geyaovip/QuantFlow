import Link from "next/link";

import { Card, PageHeader } from "@quantflow/ui";

import { NotificationPreferencesForm } from "../../../../components/notification-preferences-form";
import { getNotificationPreferences } from "../../../../lib/notification-api";

export default async function NotificationPreferencesPage() {
  const preferences = await getNotificationPreferences().catch(() => ({
    data: [],
  }));

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="通知设置"
        title="通知偏好"
        description="控制站内通知类型。关闭后仍可在通知中心查看历史记录，但不会再收到新的对应类型提醒。"
      />
      <Card className="paper-detail-card">
        <NotificationPreferencesForm preferences={preferences.data} />
      </Card>
      <Link className="secondary-link" href="/app/notifications">
        返回通知中心
      </Link>
    </div>
  );
}
