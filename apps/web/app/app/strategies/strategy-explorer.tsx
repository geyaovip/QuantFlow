"use client";

import { useMemo, useState } from "react";

import { Button, StrategyCard } from "@quantflow/ui";

import { strategies } from "./strategy-data";

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
