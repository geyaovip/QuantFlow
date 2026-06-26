import { PageHeader } from "@quantflow/ui";

export default function StrategiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="策略治理"
        title="策略管理"
        description="创建、审核、暂停与版本记录必须经过权限校验并写入审计日志。"
      />
      <div className="admin-empty">
        <strong>暂无可管理策略</strong>
        <span>策略入库后会在这里展示状态、风险等级、版本和审核记录。</span>
      </div>
    </>
  );
}
