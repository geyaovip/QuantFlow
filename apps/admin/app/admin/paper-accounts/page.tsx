import { PageHeader } from "@quantflow/ui";

import { AdminPaperConsole } from "../../../components/admin-paper-console";
import { getAdminPaperAccounts } from "../../../lib/paper-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export default async function PaperAccountsPage() {
  const accounts = await getAdminPaperAccounts().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘管理"
        description="这里只管理模拟余额、模拟订单与风险事件，不存在真实资产或订单。"
      />
      <AdminPaperConsole
        apiBaseUrl={resolveApiBaseUrl()}
        accounts={accounts.data}
      />
    </>
  );
}
