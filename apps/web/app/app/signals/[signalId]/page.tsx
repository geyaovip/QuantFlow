import { notFound } from "next/navigation";

import { Badge, Button, Card, PageHeader, RiskBadge } from "@quantflow/ui";

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
        action={<Button disabled>加入模拟盘待接入</Button>}
      />
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
      <aside className="disclaimer">{signal.riskDisclosure}</aside>
    </>
  );
}
