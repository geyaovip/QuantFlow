import { PageHeader } from "@quantflow/ui";

export default function SignalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="信号治理"
        title="信号管理"
        description="信号发布、取消和异常标记必须经过权限校验并写入审计日志。"
      />
      <div className="admin-empty">信号管理将在后续业务切片实现</div>
    </>
  );
}
