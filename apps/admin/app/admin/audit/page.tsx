import { PageHeader } from "@quantflow/ui";

import { getAdminAuditLogs } from "../../../lib/audit-api";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

export default async function AuditPage() {
  const logs = await getAdminAuditLogs().catch(() => ({
    data: [],
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
  }));

  return (
    <>
      <PageHeader
        eyebrow="可追溯操作"
        title="审计日志"
        description="查看后台关键操作的操作者、对象、原因和时间记录。"
      />
      {logs.data.length ? (
        <div className="admin-table">
          <div className="admin-table__head">
            <span>时间</span>
            <span>操作者</span>
            <span>动作</span>
            <span>资源</span>
            <span>原因</span>
          </div>
          {logs.data.map((log) => (
            <div className="admin-table__row" key={log.id}>
              <span>{formatDateTime(log.createdAt)}</span>
              <span>{log.actorEmail ?? "系统"}</span>
              <span>{log.action}</span>
              <span>
                {log.resourceType}
                {log.resourceId ? ` · ${log.resourceId}` : ""}
              </span>
              <span>{log.reason}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <strong>暂无审计日志</strong>
          <span>
            登录、权限变更、策略审核和风险处理等敏感操作会在这里留痕。
          </span>
        </div>
      )}
    </>
  );
}
