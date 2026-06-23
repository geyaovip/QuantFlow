import { PageHeader } from "@quantflow/ui";

export default function SignalsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="信号中心"
        title="跟踪策略信号"
        description="信号模块将在下一垂直切片接入；当前不提供任何真实下单操作。"
      />
      <div className="empty-state">
        <strong>暂无信号</strong>
        <p>策略产生有效模拟信号后将在这里展示。</p>
      </div>
    </div>
  );
}
