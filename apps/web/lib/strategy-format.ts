import type {
  RiskLevel,
  SignalDirection,
  SignalStatus,
  StrategyListItem,
  StrategyType,
} from "@quantflow/contracts";
import type { StrategyCardProps } from "@quantflow/ui";

export type StrategyCardRecord = StrategyCardProps & {
  id: string;
  currentSignalLabel: string;
  statusLabel: string;
  updatedAt: string;
};

export function toStrategyCardRecord(
  strategy: StrategyListItem,
): StrategyCardRecord {
  return {
    id: strategy.id,
    href: `/app/strategies/${strategy.slug}`,
    name: strategy.name,
    summary: strategy.summary,
    market: `${strategy.symbols.join(" / ")} · ${formatStrategyType(strategy.type)} · ${formatTier(strategy.requiredTier)}`,
    periodReturn: formatPercent(strategy.metric.returnRate, true),
    maxDrawdown: formatPercent(strategy.metric.maxDrawdown, false),
    winRate: formatPercent(strategy.metric.winRate, false),
    trades: strategy.metric.tradeCount,
    profitLossRatio: formatDecimal(strategy.metric.profitLossRatio),
    risk: formatRiskLevel(strategy.riskLevel),
    currentSignalLabel: strategy.currentSignal
      ? formatSignalDirection(strategy.currentSignal.direction)
      : "暂无信号",
    statusLabel: formatSignalStatus(strategy.currentSignal?.status),
    updatedAt: formatDateTime(strategy.metric.calculatedAt),
  };
}

export function formatRiskLevel(level: RiskLevel): "低" | "中" | "高" {
  if (level === "low") {
    return "低";
  }
  if (level === "medium") {
    return "中";
  }
  return "高";
}

export function formatSignalDirection(direction: SignalDirection) {
  const labels: Record<SignalDirection, string> = {
    buy: "买入观察",
    sell: "卖出观察",
    watch: "观察",
  };
  return labels[direction];
}

export function formatSignalStatus(status: SignalStatus | undefined) {
  if (!status) {
    return "暂无信号";
  }

  const labels: Record<SignalStatus, string> = {
    active: "有效",
    expired: "已过期",
    cancelled: "已取消",
    strategy_paused: "策略暂停",
    risk_blocked: "风控阻断",
  };
  return labels[status];
}

export function formatPositionPct(value: string) {
  return formatPercent(value, false);
}

export function formatPrice(value: string) {
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: string, withSign: boolean) {
  const percent = Number(value) * 100;
  const formatted = `${Math.abs(percent).toFixed(1)}%`;
  if (!withSign) {
    return percent < 0 ? `-${formatted}` : formatted;
  }
  if (percent > 0) {
    return `+${formatted}`;
  }
  if (percent < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDecimal(value: string) {
  return Number(value).toFixed(2);
}

function formatStrategyType(type: StrategyType) {
  const labels: Record<StrategyType, string> = {
    spot: "现货策略",
    grid: "网格策略",
    dca: "DCA 策略",
    trend: "趋势策略",
    swing: "波段策略",
  };
  return labels[type];
}

function formatTier(tier: StrategyListItem["requiredTier"]) {
  const labels: Record<StrategyListItem["requiredTier"], string> = {
    free: "Free",
    pro: "Pro",
    premium: "Premium",
  };
  return labels[tier];
}
