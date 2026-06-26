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
        description="创建、审核、暂停与版本记录必须经过权限校验并写入审计日志。"
      />
      <AdminStrategyConsole
        apiBaseUrl={resolveApiBaseUrl()}
        strategies={strategies.data}
      />
    </>
  );
}
