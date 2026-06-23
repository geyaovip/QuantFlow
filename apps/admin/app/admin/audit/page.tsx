import { PageHeader } from "@quantflow/ui";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="可追溯操作"
        title="审计日志"
        description="管理员敏感操作必须记录操作者、对象、原因、前后状态和请求信息。"
      />
      <div className="admin-empty">审计日志将在认证与 RBAC 切片接入</div>
    </>
  );
}
