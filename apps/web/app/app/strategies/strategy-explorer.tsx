import Link from "next/link";

import type { Pagination, RiskLevel } from "@quantflow/contracts";
import { StrategyCard } from "@quantflow/ui";

import { ListPagination } from "../../../components/list-pagination";
import type { StrategyCardRecord } from "../../../lib/strategy-format";
import { riskLevelLabel } from "../../../lib/list-query";

type StrategyExplorerProps = {
  pagination: Pagination;
  riskLevel?: RiskLevel;
  strategies: StrategyCardRecord[];
};

const riskOptions: Array<RiskLevel | undefined> = [
  undefined,
  "low",
  "medium",
  "high",
];

function buildRiskHref(level: RiskLevel | undefined) {
  return level ? `/app/strategies?risk=${level}` : "/app/strategies";
}

export function StrategyExplorer({
  pagination,
  riskLevel,
  strategies,
}: StrategyExplorerProps) {
  const query = riskLevel ? { risk: riskLevel } : {};

  return (
    <>
      <div className="filter-bar" aria-label="策略筛选">
        <div className="filter-group" role="group" aria-label="风险等级">
          {riskOptions.map((level) => {
            const active = level === riskLevel;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildRiskHref(level)}
                key={level ?? "all"}
              >
                {level ? `${riskLevelLabel(level)}风险` : "全部"}
              </Link>
            );
          })}
        </div>
        <span>
          每页 {pagination.pageSize} 条 · 共 {pagination.total} 个策略 · 第{" "}
          {pagination.page} / {pagination.totalPages} 页
        </span>
      </div>
      {strategies.length ? (
        <div className="strategy-grid">
          {strategies.map((item) => (
            <StrategyCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>暂无符合条件的策略</strong>
          <p>调整风险等级后重新查看。筛选变化会自动回到第 1 页。</p>
        </div>
      )}
      <ListPagination
        ariaLabel="策略分页"
        basePath="/app/strategies"
        pagination={pagination}
        query={query}
      />
    </>
  );
}
