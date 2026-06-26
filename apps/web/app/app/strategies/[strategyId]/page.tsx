import { notFound } from "next/navigation";

import { Badge, Button, Card, PageHeader, RiskBadge } from "@quantflow/ui";

import { StrategySubscriptionControls } from "../../../../components/strategy-subscription-controls";
import { resolveApiBaseUrl } from "../../../../lib/auth-session";
import { getStrategy } from "../../../../lib/strategy-api";
import {
  formatDateTime,
  formatPercent,
  formatRiskLevel,
  formatSignalDirection,
  formatSignalStatus,
} from "../../../../lib/strategy-format";

type StrategyDetailPageProps = {
  params: Promise<{
    strategyId: string;
  }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: StrategyDetailPageProps) {
  const { strategyId } = await params;

  return {
    title: `${strategyId} · 策略详情`,
  };
}

export default async function StrategyDetailPage({
  params,
}: StrategyDetailPageProps) {
  const { strategyId } = await params;
  const response = await getStrategy(strategyId).catch(() => null);

  if (!response) {
    notFound();
  }

  const strategy = response.data;
  const currentSignalLabel = strategy.currentSignal
    ? formatSignalDirection(strategy.currentSignal.direction)
    : "暂无信号";

  return (
    <>
      <PageHeader
        eyebrow="策略详情"
        title={strategy.name}
        description={strategy.summary}
        action={
          <StrategySubscriptionControls
            apiBaseUrl={resolveApiBaseUrl()}
            isSubscribed={Boolean(strategy.isSubscribed)}
            strategyId={strategy.id}
          />
        }
      />

      <section className="strategy-detail-layout">
        <Card className="strategy-detail-main">
          <div className="strategy-detail-topline">
            <Badge>
              {strategy.symbols.join(" / ")} · 版本 {strategy.version}
            </Badge>
            <RiskBadge level={formatRiskLevel(strategy.riskLevel)} />
          </div>
          <div className="strategy-detail-signal">
            <span>当前信号</span>
            <strong>{currentSignalLabel}</strong>
            <p>
              {formatSignalStatus(strategy.currentSignal?.status)} · 数据更新：
              {formatDateTime(strategy.metric.calculatedAt)}
            </p>
          </div>
          <dl className="strategy-detail-metrics">
            <div>
              <dt>近 90 天收益</dt>
              <dd className="positive">
                {formatPercent(strategy.metric.returnRate, true)}
              </dd>
            </div>
            <div>
              <dt>最大回撤</dt>
              <dd>{formatPercent(strategy.metric.maxDrawdown, false)}</dd>
            </div>
            <div>
              <dt>胜率 / 交易数</dt>
              <dd>
                {formatPercent(strategy.metric.winRate, false)} /{" "}
                {strategy.metric.tradeCount}
              </dd>
            </div>
            <div>
              <dt>盈亏比</dt>
              <dd>{Number(strategy.metric.profitLossRatio).toFixed(2)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="strategy-detail-side">
          <h2>模拟盘入口</h2>
          <p>
            创建模拟盘能力将在后续切片接入。MVP 仅使用模拟资金记录策略过程。
            当前策略订阅状态：{strategy.isSubscribed ? "已订阅" : "未订阅"}。
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
        <Card className="strategy-detail-note">
          <h2>策略逻辑</h2>
          <p>{strategy.logic}</p>
        </Card>
        <Card className="strategy-detail-note">
          <h2>失效场景</h2>
          <p>{strategy.failureModes}</p>
        </Card>
      </section>

      <aside className="disclaimer">{strategy.riskDisclosure}</aside>
    </>
  );
}
