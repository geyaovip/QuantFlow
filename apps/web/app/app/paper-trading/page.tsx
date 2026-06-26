import Link from "next/link";

import { Badge, Card, PageHeader } from "@quantflow/ui";

import { getPaperAccounts } from "../../../lib/paper-api";
import {
  formatMoney,
  formatPaperStatus,
  formatRatio,
} from "../../../lib/paper-format";
import { USER_PAGE_SIZE } from "../../../lib/list-query";

export const metadata = { title: "模拟盘" };

export default async function PaperTradingPage() {
  const accounts = await getPaperAccounts(1, USER_PAGE_SIZE).catch(() => null);

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘"
        description="用模拟余额观察策略执行过程。余额、订单、持仓、成交与权益均为模拟数据，不连接交易所或真实资产。"
        action={
          <Link className="primary-link" href="/app/strategies">
            从策略创建
          </Link>
        }
      />
      <section className="paper-status-grid" aria-label="模拟盘能力说明">
        <Card className="paper-status-card">
          <span>模拟账户</span>
          <strong>独立模拟余额</strong>
          <p>模拟资金、持仓和成交与真实账户完全隔离，不读取交易所资产。</p>
        </Card>
        <Card className="paper-status-card">
          <span>权益跟踪</span>
          <strong>收益与回撤并列</strong>
          <p>模拟权益、收益率和最大回撤会随成交同步更新，仅供过程观察。</p>
        </Card>
        <Card className="paper-status-card">
          <span>执行边界</span>
          <strong>不做真实下单</strong>
          <p>模拟盘只用于验证策略过程，不提供半自动或全自动交易入口。</p>
        </Card>
      </section>
      {accounts?.data.length ? (
        <section className="paper-account-list" aria-label="模拟盘列表">
          {accounts.data.map((account) => (
            <Card className="paper-account-card" key={account.id}>
              <div className="paper-account-card__header">
                <div>
                  <Badge tone="info">模拟</Badge>
                  <h2>
                    <Link href={`/app/paper-trading/${account.id}`}>
                      {account.name}
                    </Link>
                  </h2>
                  <p>
                    {account.strategyName} · {account.symbol}
                  </p>
                </div>
                <span>{formatPaperStatus(account.status)}</span>
              </div>
              <dl className="paper-account-card__metrics">
                <div>
                  <dt>当前权益</dt>
                  <dd>{formatMoney(account.currentEquity)} USDT</dd>
                </div>
                <div>
                  <dt>累计收益</dt>
                  <dd>{formatRatio(account.returnRate, true)}</dd>
                </div>
                <div>
                  <dt>最大回撤</dt>
                  <dd>{formatRatio(account.maxDrawdown, false)}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <strong>还没有创建模拟盘</strong>
          <p>
            订阅策略后，可在信号详情页创建模拟盘并执行模拟成交，跟踪权益曲线与回撤。
          </p>
          <Link className="primary-link" href="/app/signals">
            查看信号中心
          </Link>
        </div>
      )}
      <aside className="disclaimer">
        <strong>风险提示：</strong>QuantFlow
        不提供投资建议，不承诺任何收益。所有模拟结果仅供参考，历史表现不代表未来收益。
      </aside>
    </div>
  );
}
