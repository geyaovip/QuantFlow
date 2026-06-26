import type { PaperPerformancePoint } from "@quantflow/contracts";

type PaperPerformanceChartProps = {
  points: PaperPerformancePoint[];
};

export function PaperPerformanceChart({ points }: PaperPerformanceChartProps) {
  if (points.length < 2) {
    return <p className="paper-detail-empty">权益点不足，暂无法绘制曲线。</p>;
  }

  const width = 640;
  const height = 180;
  const padding = 16;
  const equities = points.map((point) => Number(point.equity));
  const drawdowns = points.map((point) => Number(point.drawdown));
  const minEquity = Math.min(...equities);
  const maxEquity = Math.max(...equities);
  const maxDrawdown = Math.max(...drawdowns, 0.0001);

  const toX = (index: number) =>
    padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
  const toEquityY = (value: number) => {
    if (maxEquity === minEquity) {
      return height / 2;
    }
    return (
      height -
      padding -
      ((value - minEquity) / (maxEquity - minEquity)) * (height - padding * 2)
    );
  };
  const toDrawdownY = (value: number) =>
    height - padding - (value / maxDrawdown) * (height - padding * 2);

  const equityPath = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${toX(index)},${toEquityY(Number(point.equity))}`;
    })
    .join(" ");
  const drawdownPath = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${toX(index)},${toDrawdownY(Number(point.drawdown))}`;
    })
    .join(" ");

  return (
    <div className="paper-performance-chart" aria-label="模拟权益与回撤曲线">
      <svg
        aria-hidden="true"
        className="paper-performance-chart__svg"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path className="paper-performance-chart__equity" d={equityPath} />
        <path className="paper-performance-chart__drawdown" d={drawdownPath} />
      </svg>
      <div className="paper-performance-chart__legend">
        <span>权益曲线（模拟）</span>
        <span>回撤曲线</span>
      </div>
    </div>
  );
}
