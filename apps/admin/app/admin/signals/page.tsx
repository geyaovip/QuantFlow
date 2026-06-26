import { PageHeader } from "@quantflow/ui";

import { AdminSignalsConsole } from "../../../components/admin-signals-console";
import { getAdminSignals } from "../../../lib/strategy-api";
import { resolveApiBaseUrl } from "../../../lib/strategy-api";

export default async function SignalsPage() {
  const signals = await getAdminSignals().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="信号治理"
        title="信号管理"
        description="信号发布、取消和异常标记必须经过权限校验并写入审计日志。"
      />
      {signals.data.length ? (
        <AdminSignalsConsole
          apiBaseUrl={resolveApiBaseUrl()}
          signals={signals.data}
        />
      ) : (
        <div className="admin-empty">
          <strong>暂无信号记录</strong>
          <span>
            信号产生后会在这里展示策略、币种、状态、风险等级和处理记录。
          </span>
        </div>
      )}
    </>
  );
}
