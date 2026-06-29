import { PageHeader } from "@quantflow/ui";

import { AdminStrategyConsole } from "../../../components/admin-strategy-console";
import {
  getAdminStrategies,
  resolveApiBaseUrl,
} from "../../../lib/strategy-api";

export default async function StrategiesPage() {
  const strategies = await getAdminStrategies();

  return (
    <>
      <PageHeader
        eyebrow="策略治理"
        title="策略管理"
        description="创建策略草稿，处理审核、暂停、下架和版本状态。"
      />
      <AdminStrategyConsole
        apiBaseUrl={resolveApiBaseUrl()}
        strategies={strategies.data}
      />
    </>
  );
}
