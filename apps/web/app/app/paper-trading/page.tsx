import { PageHeader } from "@quantflow/ui";

export default function PaperTradingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘"
        description="用模拟余额观察策略执行过程。余额、订单、持仓、成交与权益均为模拟数据，不连接交易所或真实资产。"
      />
      <div className="empty-state">
        <strong>还没有创建模拟盘</strong>
        <p>
          开通访问后，可把策略加入模拟盘，跟踪权益曲线、最大回撤、持仓和风险事件。
        </p>
      </div>
    </div>
  );
}
