import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, PageHeader } from "@quantflow/ui";

import { getAdminPaperAccount } from "../../../../lib/paper-api";

type AdminPaperAccountDetailPageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function AdminPaperAccountDetailPage({
  params,
}: AdminPaperAccountDetailPageProps) {
  const { accountId } = await params;
  const response = await getAdminPaperAccount(accountId).catch(() => null);

  if (!response) {
    notFound();
  }

  const account = response.data;

  return (
    <>
      <Link className="admin-back-link" href="/admin/paper-accounts">
        ← 返回模拟盘列表
      </Link>
      <PageHeader
        eyebrow="模拟盘详情"
        title={account.name}
        description={`${account.userEmail} · ${account.strategyName} · ${account.symbol}`}
      />
      <Card className="admin-detail-card">
        <dl className="admin-detail-grid">
          <div>
            <dt>状态</dt>
            <dd>{account.status}</dd>
          </div>
          <div>
            <dt>当前权益（模拟）</dt>
            <dd>{account.currentEquity} USDT</dd>
          </div>
          <div>
            <dt>最大回撤</dt>
            <dd>{account.maxDrawdown}</dd>
          </div>
          <div>
            <dt>累计收益</dt>
            <dd>{account.returnRate}</dd>
          </div>
        </dl>
      </Card>
      <Card className="admin-detail-card">
        <h2>最近成交</h2>
        {account.recentTrades.length ? (
          <ul className="admin-detail-list">
            {account.recentTrades.map((trade) => (
              <li key={trade.id}>
                {trade.side} · {trade.price} · {trade.executedAt}
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无成交记录。</p>
        )}
      </Card>
      <Card className="admin-detail-card">
        <h2>风险事件</h2>
        {account.riskEvents.length ? (
          <ul className="admin-detail-list">
            {account.riskEvents.map((event) => (
              <li key={event.id}>
                {event.message} · {event.occurredAt}
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无风险事件。</p>
        )}
      </Card>
      <Link className="secondary-link" href="/admin/paper-accounts">
        返回模拟盘列表
      </Link>
    </>
  );
}
