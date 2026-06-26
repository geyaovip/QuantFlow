import { PageHeader } from "@quantflow/ui";

import { AdminRiskConsole } from "../../../components/admin-risk-console";
import { getAdminRiskEvents } from "../../../lib/governance-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export default async function RiskPage() {
  const events = await getAdminRiskEvents().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="风险治理"
        title="风险管理"
        description="集中处理回撤、连亏、样本不足和行情延迟事件。"
      />
      <AdminRiskConsole apiBaseUrl={resolveApiBaseUrl()} events={events.data} />
    </>
  );
}
