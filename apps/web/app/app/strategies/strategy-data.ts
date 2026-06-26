import type { StrategyCardProps } from "@quantflow/ui";

export type StrategyRecord = StrategyCardProps & {
  id: string;
  signal: string;
  status: "观察中" | "样本不足" | "暂停观察";
  updatedAt: string;
  suitableMarket: string;
  unsuitableMarket: string;
};

export const strategies: StrategyRecord[] = [
  {
    id: "btc-trend",
    href: "/app/strategies/btc-trend",
    name: "BTC 趋势过滤",
    summary: "结合中期趋势与波动过滤，重点观察震荡阶段的信号失效率。",
    market: "BTCUSDT · 现货模拟",
    periodReturn: "+12.8%",
    maxDrawdown: "-6.4%",
    winRate: "58.2%",
    trades: 67,
    profitLossRatio: "1.46",
    risk: "中",
    signal: "观察",
    status: "观察中",
    updatedAt: "2026-06-26 10:40 UTC+8",
    suitableMarket: "趋势方向清晰、波动率稳定放大的行情。",
    unsuitableMarket: "低流动性、快速反复拉扯或突发行情阶段。",
  },
  {
    id: "eth-breakout",
    href: "/app/strategies/eth-breakout",
    name: "ETH 波动突破",
    summary: "观察波动扩张后的价格延续，使用固定失效条件控制风险。",
    market: "ETHUSDT · 现货模拟",
    periodReturn: "+8.6%",
    maxDrawdown: "-4.9%",
    winRate: "54.7%",
    trades: 53,
    profitLossRatio: "1.39",
    risk: "中",
    signal: "等待确认",
    status: "观察中",
    updatedAt: "2026-06-26 10:35 UTC+8",
    suitableMarket: "突破后成交活跃、价格延续性较强的行情。",
    unsuitableMarket: "假突破密集、波动收缩或方向频繁切换的行情。",
  },
  {
    id: "sol-mean",
    href: "/app/strategies/sol-mean",
    name: "SOL 均值观察",
    summary: "在流动性与行情有效的前提下观察短周期偏离与回归。",
    market: "SOLUSDT · 现货模拟",
    periodReturn: "+5.1%",
    maxDrawdown: "-3.2%",
    winRate: "61.0%",
    trades: 41,
    profitLossRatio: "1.21",
    risk: "低",
    signal: "样本观察",
    status: "样本不足",
    updatedAt: "2026-06-26 10:20 UTC+8",
    suitableMarket: "波动回落、价格围绕区间中枢运行的行情。",
    unsuitableMarket: "单边趋势过强或流动性快速下降的行情。",
  },
];
