import { PageHeader } from "@quantflow/ui";

export default function PaperTradingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘"
        description="余额、订单、持仓、成交与权益均为模拟数据，不连接交易所或真实资产。"
      />
      <div className="empty-state">
        <strong>还没有模拟盘</strong>
        <p>模拟撮合能力将在后续垂直切片实现。</p>
      </div>
    </div>
  );
}
