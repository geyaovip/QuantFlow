import type {
  RiskLevel,
  SignalDirection,
  SignalStatus,
  StrategyType,
} from "@quantflow/contracts";

export const USER_PAGE_SIZE = 20;

export function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseRiskLevel(
  value: string | undefined,
): RiskLevel | undefined {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return undefined;
}

export function parseSignalDirection(
  value: string | undefined,
): SignalDirection | undefined {
  if (value === "buy" || value === "sell" || value === "watch") {
    return value;
  }
  return undefined;
}

export function parseSignalStatus(
  value: string | undefined,
): SignalStatus | undefined {
  if (
    value === "active" ||
    value === "expired" ||
    value === "cancelled" ||
    value === "strategy_paused" ||
    value === "risk_blocked"
  ) {
    return value;
  }
  return undefined;
}

export function parseStrategyType(
  value: string | undefined,
): StrategyType | undefined {
  if (
    value === "spot" ||
    value === "grid" ||
    value === "dca" ||
    value === "trend" ||
    value === "swing"
  ) {
    return value;
  }
  return undefined;
}

export function strategyTypeLabel(type: StrategyType | undefined) {
  const labels: Record<StrategyType, string> = {
    spot: "现货",
    grid: "网格",
    dca: "定投",
    trend: "趋势",
    swing: "波段",
  };
  return type ? labels[type] : "全部类型";
}

export function signalStatusLabel(status: SignalStatus | undefined) {
  if (status === "active") {
    return "有效";
  }
  if (status === "expired") {
    return "过期";
  }
  if (status === "cancelled") {
    return "已取消";
  }
  return "全部";
}

export function riskLevelLabel(level: RiskLevel | undefined) {
  if (level === "low") {
    return "低";
  }
  if (level === "medium") {
    return "中";
  }
  if (level === "high") {
    return "高";
  }
  return "全部";
}

export function signalDirectionLabel(direction: SignalDirection | undefined) {
  if (direction === "buy") {
    return "买入";
  }
  if (direction === "sell") {
    return "卖出";
  }
  if (direction === "watch") {
    return "观望";
  }
  return "全部";
}
