"use client";

import { useMemo, useState } from "react";

import { Button, StrategyCard, type StrategyCardProps } from "@quantflow/ui";

const strategies: Array<StrategyCardProps & { id: string }> = [
  {
    id: "btc-trend",
    name: "BTC 趋势过滤",
    summary: "结合中期趋势与波动过滤，重点观察震荡阶段的信号失效率。",
    market: "BTCUSDT · 现货模拟",
    periodReturn: "+12.8%",
    maxDrawdown: "-6.4%",
    winRate: "58.2%",
    trades: 67,
    profitLossRatio: "1.46",
    risk: "中",
  },
  {
    id: "eth-breakout",
    name: "ETH 波动突破",
    summary: "观察波动扩张后的价格延续，使用固定失效条件控制风险。",
    market: "ETHUSDT · 现货模拟",
    periodReturn: "+8.6%",
    maxDrawdown: "-4.9%",
    winRate: "54.7%",
    trades: 53,
    profitLossRatio: "1.39",
    risk: "中",
  },
  {
    id: "sol-mean",
    name: "SOL 均值观察",
    summary: "在流动性与行情有效的前提下观察短周期偏离与回归。",
    market: "SOLUSDT · 现货模拟",
    periodReturn: "+5.1%",
    maxDrawdown: "-3.2%",
    winRate: "61.0%",
    trades: 41,
    profitLossRatio: "1.21",
    risk: "低",
  },
];

export function StrategyExplorer() {
  const [risk, setRisk] = useState<"全部" | "低" | "中" | "高">("全部");
  const filtered = useMemo(
    () =>
      risk === "全部"
        ? strategies
        : strategies.filter((item) => item.risk === risk),
    [risk],
  );

  return (
    <>
      <div className="filter-bar" aria-label="策略筛选">
        <div className="filter-group" role="group" aria-label="风险等级">
          {(["全部", "低", "中", "高"] as const).map((item) => (
            <Button
              key={item}
              variant={risk === item ? "primary" : "secondary"}
              onClick={() => setRisk(item)}
            >
              {item}风险
            </Button>
          ))}
        </div>
        <span>每页 20 条 · 共 {filtered.length} 个策略 · 第 1 / 1 页</span>
      </div>
      {filtered.length ? (
        <div className="strategy-grid">
          {filtered.map((item) => (
            <StrategyCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>暂无符合条件的策略</strong>
          <p>调整风险等级后重新查看。筛选变化会自动回到第 1 页。</p>
        </div>
      )}
      <nav className="pagination" aria-label="策略分页">
        <button disabled>上一页</button>
        <span aria-current="page">1</span>
        <button disabled>下一页</button>
      </nav>
    </>
  );
}
