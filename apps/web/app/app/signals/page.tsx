import { PageHeader } from "@quantflow/ui";

export default function SignalsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="信号中心"
        title="跟踪策略信号"
        description="这里展示你有权限查看的策略信号、触发价格、失效条件和风险状态。QuantFlow 不提供真实下单入口。"
      />
      <div className="empty-state">
        <strong>当前没有可展示的信号</strong>
        <p>
          当已关注策略产生有效信号后，会在这里显示方向、价格区间、有效期和风险等级。
        </p>
      </div>
    </div>
  );
}
