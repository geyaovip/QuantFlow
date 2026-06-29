import type { StrategyMetric } from "@quantflow/contracts";

import { formatMetricPeriod, formatPercent } from "../lib/strategy-format";

type StrategyPerformanceChartProps = {
  metrics: StrategyMetric[];
};

const PERIOD_ORDER: StrategyMetric["period"][] = [
  "seven_days",
  "thirty_days",
  "ninety_days",
  "all_time",
];

export function StrategyPerformanceChart({
  metrics,
}: StrategyPerformanceChartProps) {
  const points = [...metrics].sort(
    (a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period),
  );

  if (points.length < 2) {
    return <p className="paper-detail-empty">指标点不足，暂无法绘制曲线。</p>;
  }

  const width = 640;
  const height = 190;
  const padding = 18;
  const returns = points.map((point) => Number(point.returnRate));
  const drawdowns = points.map((point) => Math.abs(Number(point.maxDrawdown)));
  const minReturn = Math.min(...returns, 0);
  const maxReturn = Math.max(...returns, 0.001);
  const maxDrawdown = Math.max(...drawdowns, 0.001);
  const toX = (index: number) =>
    padding + (index / (points.length - 1)) * (width - padding * 2);
  const toReturnY = (value: number) => {
    if (maxReturn === minReturn) {
      return height / 2;
    }
    return (
      height -
      padding -
      ((value - minReturn) / (maxReturn - minReturn)) * (height - padding * 2)
    );
  };
  const toDrawdownY = (value: number) =>
    height - padding - (value / maxDrawdown) * (height - padding * 2);

  const returnPath = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${toX(index)},${toReturnY(Number(point.returnRate))}`;
    })
    .join(" ");
  const drawdownPath = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${toX(index)},${toDrawdownY(Math.abs(Number(point.maxDrawdown)))}`;
    })
    .join(" ");

  return (
    <div className="strategy-performance-chart" aria-label="收益与回撤曲线">
      <svg
        aria-hidden="true"
        className="paper-performance-chart__svg"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path className="paper-performance-chart__equity" d={returnPath} />
        <path className="paper-performance-chart__drawdown" d={drawdownPath} />
      </svg>
      <div className="paper-performance-chart__legend">
        <span>收益曲线</span>
        <span>最大回撤曲线</span>
      </div>
      <dl className="strategy-performance-chart__points">
        {points.map((point) => (
          <div key={point.period}>
            <dt>{formatMetricPeriod(point.period)}</dt>
            <dd>
              {formatPercent(point.returnRate, true)} /{" "}
              {formatPercent(point.maxDrawdown, false)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
