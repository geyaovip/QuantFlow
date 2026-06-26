import { PageHeader } from "@quantflow/ui";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="可追溯操作"
        title="审计日志"
        description="管理员敏感操作必须记录操作者、对象、原因、前后状态和请求信息。"
      />
      <div className="admin-empty">
        <strong>暂无审计日志</strong>
        <span>登录、权限变更、策略审核和风险处理等敏感操作会在这里留痕。</span>
      </div>
    </>
  );
}
