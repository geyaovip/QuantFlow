import { PageHeader } from "@quantflow/ui";

export default function RiskPage() {
  return (
    <>
      <PageHeader
        eyebrow="风险治理"
        title="风险管理"
        description="集中处理回撤、连亏、样本不足和行情延迟事件。"
      />
      <div className="admin-empty">风险管理将在后续业务切片实现</div>
    </>
  );
}
