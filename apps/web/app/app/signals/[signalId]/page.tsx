import { notFound } from "next/navigation";

import { Badge, Card, PageHeader, RiskBadge } from "@quantflow/ui";

import { PaperAccountCreateForm } from "../../../../components/paper-account-create-form";
import { getSignal } from "../../../../lib/strategy-api";
import {
  formatDateTime,
  formatPositionPct,
  formatPrice,
  formatRiskLevel,
  formatSignalDirection,
  formatSignalStatus,
} from "../../../../lib/strategy-format";

type SignalDetailPageProps = {
  params: Promise<{ signalId: string }>;
};

export async function generateMetadata({ params }: SignalDetailPageProps) {
  const { signalId } = await params;
  return { title: `${signalId} · 信号详情` };
}

export default async function SignalDetailPage({
  params,
}: SignalDetailPageProps) {
  const { signalId } = await params;
  const response = await getSignal(signalId).catch(() => null);

  if (!response) {
    notFound();
  }

  const signal = response.data;

  return (
    <>
      <PageHeader
        eyebrow="信号详情"
        title={`${signal.strategyName} · ${formatSignalDirection(signal.direction)}`}
        description="信号仅用于观察和模拟验证，不提供真实下单、半自动或自动交易入口。"
      />
      <section className="signal-detail-grid">
        <Card className="signal-card">
          <div className="signal-card__topline">
            <div>
              <Badge>{signal.symbol}</Badge>
              <RiskBadge level={formatRiskLevel(signal.riskLevel)} />
            </div>
            <span>{formatSignalStatus(signal.status)}</span>
          </div>
          <div className="signal-card__body">
            <div>
              <p>{signal.strategyName}</p>
              <h2>{formatSignalDirection(signal.direction)}</h2>
              <span>
                生成：{formatDateTime(signal.generatedAt)} · 有效至：
                {formatDateTime(signal.validUntil)}
              </span>
            </div>
            <dl>
              <div>
                <dt>触发价格</dt>
                <dd>{formatPrice(signal.triggerPrice)}</dd>
              </div>
              <div>
                <dt>当前快照</dt>
                <dd>{formatPrice(signal.currentPriceSnapshot)}</dd>
              </div>
              <div>
                <dt>建议仓位</dt>
                <dd>{formatPositionPct(signal.suggestedPositionPct)}</dd>
              </div>
              <div>
                <dt>止损 / 止盈</dt>
                <dd>
                  {formatPrice(signal.stopLossPrice)} /{" "}
                  {formatPrice(signal.takeProfitPrice)}
                </dd>
              </div>
            </dl>
          </div>
          <p className="signal-card__rationale">{signal.rationale}</p>
        </Card>
        {signal.status === "active" ? (
          <Card className="paper-create-panel">
            <h2>创建模拟盘</h2>
            <p>
              创建后可按 paper-engine-v1
              规则尝试模拟执行该信号。观望信号仅创建账户，不自动成交。
            </p>
            <PaperAccountCreateForm
              defaults={{
                strategyId: signal.strategyId,
                symbol: signal.symbol,
                name: `${signal.strategyName} 模拟盘`,
                initialBalance: "10000.00",
                maxPositionPct: "0.10",
                maxPositions: 3,
                signalId: signal.id,
              }}
              submitLabel={
                signal.direction === "watch"
                  ? "创建模拟盘"
                  : "创建并模拟执行信号"
              }
            />
          </Card>
        ) : null}
        <Card className="app-section-card">
          <div className="app-section-card__header">
            <div>
              <h2>使用前确认</h2>
              <p>信号有效性受行情延迟、策略状态和风控规则影响。</p>
            </div>
          </div>
          <ul className="app-muted-list">
            <li>
              <span>状态</span>
              <strong>{formatSignalStatus(signal.status)}</strong>
            </li>
            <li>
              <span>风险等级</span>
              <strong>{formatRiskLevel(signal.riskLevel)}风险</strong>
            </li>
            <li>
              <span>可执行能力</span>
              <strong>仅观察 / 模拟验证</strong>
            </li>
            {signal.usedInPaperTrading ? (
              <li>
                <span>模拟使用</span>
                <strong>已用于模拟成交</strong>
              </li>
            ) : null}
          </ul>
        </Card>
      </section>
      <aside className="disclaimer">{signal.riskDisclosure}</aside>
    </>
  );
}
