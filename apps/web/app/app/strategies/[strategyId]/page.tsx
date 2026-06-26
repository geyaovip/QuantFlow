import { notFound } from "next/navigation";

import { Badge, Button, Card, PageHeader, RiskBadge } from "@quantflow/ui";

import { strategies } from "../strategy-data";

const riskDisclosure =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

type StrategyDetailPageProps = {
  params: Promise<{
    strategyId: string;
  }>;
};

export function generateStaticParams() {
  return strategies.map((strategy) => ({ strategyId: strategy.id }));
}

export async function generateMetadata({ params }: StrategyDetailPageProps) {
  const { strategyId } = await params;
  const strategy = strategies.find((item) => item.id === strategyId);

  return {
    title: strategy ? `${strategy.name} · 策略详情` : "策略详情",
  };
}

export default async function StrategyDetailPage({
  params,
}: StrategyDetailPageProps) {
  const { strategyId } = await params;
  const strategy = strategies.find((item) => item.id === strategyId);

  if (!strategy) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="策略详情"
        title={strategy.name}
        description={strategy.summary}
        action={<Button disabled>创建模拟盘</Button>}
      />

      <section className="strategy-detail-layout">
        <Card className="strategy-detail-main">
          <div className="strategy-detail-topline">
            <Badge>{strategy.market}</Badge>
            <RiskBadge level={strategy.risk} />
          </div>
          <div className="strategy-detail-signal">
            <span>当前信号</span>
            <strong>{strategy.signal}</strong>
            <p>
              {strategy.status} · 数据更新：{strategy.updatedAt}
            </p>
          </div>
          <dl className="strategy-detail-metrics">
            <div>
              <dt>近 90 天收益</dt>
              <dd className="positive">{strategy.periodReturn}</dd>
            </div>
            <div>
              <dt>最大回撤</dt>
              <dd>{strategy.maxDrawdown}</dd>
            </div>
            <div>
              <dt>胜率 / 交易数</dt>
              <dd>
                {strategy.winRate} / {strategy.trades}
              </dd>
            </div>
            <div>
              <dt>盈亏比</dt>
              <dd>{strategy.profitLossRatio}</dd>
            </div>
          </dl>
        </Card>

        <Card className="strategy-detail-side">
          <h2>模拟盘入口</h2>
          <p>
            创建模拟盘能力将在后续切片接入。MVP 仅使用模拟资金记录策略过程。
          </p>
          <Button disabled>等待接入</Button>
        </Card>
      </section>

      <section className="strategy-detail-grid" aria-label="策略说明">
        <Card className="strategy-detail-note">
          <h2>适合行情</h2>
          <p>{strategy.suitableMarket}</p>
        </Card>
        <Card className="strategy-detail-note">
          <h2>不适合行情</h2>
          <p>{strategy.unsuitableMarket}</p>
        </Card>
      </section>

      <aside className="disclaimer">{riskDisclosure}</aside>
    </>
  );
}
