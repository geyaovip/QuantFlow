import { PageHeader } from "@quantflow/ui";

export default function StrategiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="策略治理"
        title="策略管理"
        description="创建、审核、暂停与版本记录必须经过权限校验并写入审计日志。"
      />
      <div className="admin-empty">策略管理将在下一业务切片实现</div>
    </>
  );
}
