import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, PageHeader, RiskBadge } from "@quantflow/ui";

import { StrategySubscriptionControls } from "../../../../components/strategy-subscription-controls";
import { PaperAccountCreateForm } from "../../../../components/paper-account-create-form";
import { ApiError } from "../../../../lib/api-error";
import { resolveApiBaseUrl } from "../../../../lib/auth-session";
import { getStrategy } from "../../../../lib/strategy-api";
import {
  formatDateTime,
  formatMetricPeriod,
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
  let response;

  try {
    response = await getStrategy(strategyId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <>
          <PageHeader
            eyebrow="策略详情"
            title="需要更高会员计划"
            description="该策略仅向 Pro 或 Premium 会员开放。当前为模拟开通流程，不会产生真实扣款。"
          />
          <Card className="membership-upgrade-card">
            <p>{error.message}</p>
            <div className="app-hero-actions">
              <Link className="primary-link" href="/app/membership">
                查看会员计划
              </Link>
              <Link className="secondary-link" href="/app/strategies">
                返回策略广场
              </Link>
            </div>
          </Card>
        </>
      );
    }

    notFound();
  }

  const strategy = response.data;
  const currentSignalLabel = strategy.currentSignal
    ? formatSignalDirection(strategy.currentSignal.direction)
    : "暂无信号";
  const maxReturn = Math.max(
    ...strategy.metrics.map((metric) => Math.abs(Number(metric.returnRate))),
    0.01,
  );
  const maxDrawdown = Math.max(
    ...strategy.metrics.map((metric) => Math.abs(Number(metric.maxDrawdown))),
    0.01,
  );

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
            <div>
              <dt>样本量</dt>
              <dd>{strategy.metric.sampleSize}</dd>
            </div>
            <div>
              <dt>数据来源</dt>
              <dd>{strategy.metric.dataSource}</dd>
            </div>
          </dl>
        </Card>

        <Card className="strategy-detail-side">
          <h2>多周期表现</h2>
          <p>收益与最大回撤按同一周期并列展示，避免只看单一收益。</p>
          <div className="metric-bars" aria-label="多周期收益与回撤">
            {strategy.metrics.map((metric) => (
              <div className="metric-bars__row" key={metric.period}>
                <span>{formatMetricPeriod(metric.period)}</span>
                <div className="metric-bars__track">
                  <div
                    className="metric-bars__return"
                    style={{
                      width: `${(Math.abs(Number(metric.returnRate)) / maxReturn) * 100}%`,
                    }}
                  />
                  <div
                    className="metric-bars__drawdown"
                    style={{
                      width: `${(Math.abs(Number(metric.maxDrawdown)) / maxDrawdown) * 100}%`,
                    }}
                  />
                </div>
                <strong>
                  {formatPercent(metric.returnRate, true)} /{" "}
                  {formatPercent(metric.maxDrawdown, false)}
                </strong>
              </div>
            ))}
          </div>
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
        <Card className="strategy-detail-note">
          <h2>仓位与止损</h2>
          <p>
            {strategy.positionSizing} {strategy.stopLossLogic}
          </p>
        </Card>
        <Card className="strategy-detail-note">
          <h2>止盈逻辑</h2>
          <p>{strategy.takeProfitLogic}</p>
        </Card>
      </section>

      <section className="strategy-signal-history" aria-label="历史信号">
        <div className="strategy-detail-section-heading">
          <h2>历史信号</h2>
          <p>展示最近信号记录，包含状态、方向和有效期。</p>
        </div>
        {strategy.recentSignals.length ? (
          <div className="signal-history-list">
            {strategy.recentSignals.map((signal) => (
              <Card className="signal-history-item" key={signal.id}>
                <div>
                  <strong>{formatSignalDirection(signal.direction)}</strong>
                  <span>{formatSignalStatus(signal.status)}</span>
                </div>
                <p>
                  生成：{formatDateTime(signal.generatedAt)} · 有效至：
                  {formatDateTime(signal.validUntil)}
                </p>
                <Link
                  className="secondary-link"
                  href={`/app/signals/${signal.id}`}
                >
                  查看详情
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>暂无历史信号</strong>
          </div>
        )}
      </section>

      <section className="strategy-detail-layout">
        <Card className="strategy-detail-side">
          <h2>模拟盘入口</h2>
          <p>
            当前策略订阅状态：{strategy.isSubscribed ? "已订阅" : "未订阅"}。
            模拟盘仅使用模拟资金记录策略过程，不连接交易所或真实资产。
          </p>
          {strategy.isSubscribed ? (
            <PaperAccountCreateForm
              defaults={{
                strategyId: strategy.id,
                symbol: strategy.symbols[0] ?? "BTCUSDT",
                name: `${strategy.name} 模拟盘`,
                initialBalance: "10000.00",
                maxPositionPct: "0.10",
                maxPositions: 3,
              }}
              redirectTo="list"
              submitLabel="创建模拟盘"
            />
          ) : (
            <p className="app-muted-copy">请先订阅策略信号，再创建模拟盘。</p>
          )}
        </Card>
        <Card className="strategy-detail-side">
          <h2>阅读顺序</h2>
          <ul className="app-muted-list">
            <li>
              <span>先看</span>
              <strong>收益 / 回撤 / 样本量</strong>
            </li>
            <li>
              <span>再看</span>
              <strong>适合与失效场景</strong>
            </li>
            <li>
              <span>最后</span>
              <strong>订阅信号或等待模拟验证</strong>
            </li>
          </ul>
        </Card>
      </section>

      <aside className="disclaimer">{strategy.riskDisclosure}</aside>
    </>
  );
}
