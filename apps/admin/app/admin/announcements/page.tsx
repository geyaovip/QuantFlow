import { PageHeader } from "@quantflow/ui";

import { AdminAnnouncementsConsole } from "../../../components/admin-announcements-console";
import { getAdminAnnouncements } from "../../../lib/governance-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export const metadata = { title: "系统公告" };

export default async function AnnouncementsPage() {
  const announcements = await getAdminAnnouncements().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="运营通知"
        title="系统公告"
        description="创建并发布平台公告。发布后会向全部活跃用户发送站内系统通知。"
      />
      <AdminAnnouncementsConsole
        announcements={announcements.data}
        apiBaseUrl={resolveApiBaseUrl()}
      />
    </>
  );
}
