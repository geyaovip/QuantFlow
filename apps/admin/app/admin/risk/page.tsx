import { PageHeader } from "@quantflow/ui";

export default function RiskPage() {
  return (
    <>
      <PageHeader
        eyebrow="风险治理"
        title="风险管理"
        description="集中处理回撤、连亏、样本不足和行情延迟事件。"
      />
      <div className="admin-empty">
        <strong>暂无待处理风险事件</strong>
        <span>
          当策略或模拟盘触发风险阈值时，会在这里展示等级、对象和处理状态。
        </span>
      </div>
    </>
  );
}
