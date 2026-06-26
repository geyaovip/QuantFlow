import type { RiskLevel, SignalDirection } from "@quantflow/contracts";

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
