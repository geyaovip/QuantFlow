import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, PageHeader } from "@quantflow/ui";

import { PaperAccountActions } from "../../../../components/paper-account-actions";
import { PaperPerformanceChart } from "../../../../components/paper-performance-chart";
import { getPaperAccount } from "../../../../lib/paper-api";
import {
  formatMoney,
  formatPaperStatus,
  formatRatio,
} from "../../../../lib/paper-format";
import { formatDateTime } from "../../../../lib/strategy-format";

type PaperAccountDetailPageProps = {
  params: Promise<{ accountId: string }>;
};

export async function generateMetadata({
  params,
}: PaperAccountDetailPageProps) {
  const { accountId } = await params;
  return { title: `${accountId} · 模拟盘详情` };
}

export default async function PaperAccountDetailPage({
  params,
}: PaperAccountDetailPageProps) {
  const { accountId } = await params;
  const response = await getPaperAccount(accountId).catch(() => null);

  if (!response) {
    notFound();
  }

  const account = response.data;
  const latestPerformance = account.performance.at(-1);

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="模拟盘详情"
        title={account.name}
        description={`${account.strategyName} · ${account.symbol} · ${formatPaperStatus(account.status)}`}
        action={
          <PaperAccountActions accountId={account.id} status={account.status} />
        }
      />
      <section className="app-kpi-grid" aria-label="模拟权益概览">
        <div>
          <span>当前权益（模拟）</span>
          <strong>{formatMoney(account.currentEquity)} USDT</strong>
        </div>
        <div>
          <span>累计收益</span>
          <strong>{formatRatio(account.returnRate, true)}</strong>
        </div>
        <div>
          <span>最大回撤</span>
          <strong>{formatRatio(account.maxDrawdown, false)}</strong>
        </div>
        <div>
          <span>现金余额</span>
          <strong>{formatMoney(account.cashBalance)} USDT</strong>
        </div>
      </section>
      <section className="paper-detail-grid">
        <Card className="paper-detail-card">
          <h2>模拟持仓</h2>
          {account.positions.filter((position) => position.status === "open")
            .length ? (
            <div className="paper-position-list">
              {account.positions
                .filter((position) => position.status === "open")
                .map((position) => (
                  <div className="paper-position-item" key={position.id}>
                    <div>
                      <Badge>{position.symbol}</Badge>
                      <strong>{position.quantity}</strong>
                    </div>
                    <p>
                      均价 {formatMoney(position.averagePrice)} · 标记价{" "}
                      {formatMoney(position.markPrice)} · 浮动盈亏{" "}
                      {formatMoney(position.unrealizedPnl)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="paper-detail-empty">当前没有持仓。</p>
          )}
        </Card>
        <Card className="paper-detail-card">
          <h2>最近成交</h2>
          {account.recentTrades.length ? (
            <div className="paper-trade-list">
              {account.recentTrades.map((trade) => (
                <div className="paper-trade-item" key={trade.id}>
                  <strong>
                    {trade.side === "buy" ? "买入" : "卖出"} ·{" "}
                    {formatMoney(trade.price)}
                  </strong>
                  <p>
                    数量 {trade.quantity} · 手续费 {formatMoney(trade.fee)} ·{" "}
                    {formatDateTime(trade.executedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="paper-detail-empty">还没有模拟成交记录。</p>
          )}
        </Card>
        <Card className="paper-detail-card">
          <h2>权益与回撤曲线（模拟）</h2>
          <PaperPerformanceChart points={account.performance} />
        </Card>
        <Card className="paper-detail-card">
          <h2>风险事件</h2>
          {account.riskEvents.length ? (
            <div className="paper-risk-list">
              {account.riskEvents.map((event) => (
                <div className="paper-risk-item" key={event.id}>
                  <strong>{event.message}</strong>
                  <p>{formatDateTime(event.occurredAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="paper-detail-empty">暂无风险事件。</p>
          )}
        </Card>
      </section>
      {latestPerformance ? (
        <p className="section-note">
          引擎版本 {account.engineVersion} · 最近记录{" "}
          {formatDateTime(latestPerformance.recordedAt)}
        </p>
      ) : null}
      <aside className="disclaimer">{account.riskDisclosure}</aside>
      <Link className="secondary-link" href="/app/paper-trading">
        返回模拟盘列表
      </Link>
    </div>
  );
}
