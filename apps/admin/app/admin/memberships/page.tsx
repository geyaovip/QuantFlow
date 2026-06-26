import { PageHeader } from "@quantflow/ui";

import { AdminMembershipsConsole } from "../../../components/admin-memberships-console";
import { getAdminSubscriptions } from "../../../lib/governance-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export const metadata = { title: "会员管理" };

export default async function MembershipsPage() {
  const subscriptions = await getAdminSubscriptions().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="会员与订阅"
        title="会员管理"
        description="分页查看会员订阅记录，支持取消有效订阅。人工开通请前往用户管理。"
      />
      <AdminMembershipsConsole
        apiBaseUrl={resolveApiBaseUrl()}
        subscriptions={subscriptions.data}
      />
    </>
  );
}
