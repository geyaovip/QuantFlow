import Link from "next/link";

import type { Pagination, RiskLevel, StrategyType } from "@quantflow/contracts";
import { StrategyCard } from "@quantflow/ui";

import { ListPagination } from "../../../components/list-pagination";
import type { StrategyCardRecord } from "../../../lib/strategy-format";
import {
  riskLevelLabel,
  strategySymbolLabel,
  strategyTypeLabel,
} from "../../../lib/list-query";

type StrategyExplorerProps = {
  pagination: Pagination;
  query: Record<string, string | undefined>;
  riskLevel?: RiskLevel;
  sortBy?: string;
  strategies: StrategyCardRecord[];
  symbol?: string;
  type?: StrategyType;
};

const riskOptions: Array<RiskLevel | undefined> = [
  undefined,
  "low",
  "medium",
  "high",
];

const typeOptions: Array<StrategyType | undefined> = [
  undefined,
  "trend",
  "spot",
  "swing",
  "grid",
  "dca",
];

const symbolOptions = [
  undefined,
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
] as const;

const sortOptions = [
  { value: undefined, label: "最新上线" },
  { value: "riskLevel", label: "风险等级" },
] as const;

function buildHref(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  const merged = { ...base, ...patch };

  for (const [key, value] of Object.entries(merged)) {
    if (value) {
      params.set(key, value);
    }
  }

  const search = params.toString();
  return search ? `/app/strategies?${search}` : "/app/strategies";
}

export function StrategyExplorer({
  pagination,
  query,
  riskLevel,
  sortBy,
  strategies,
  symbol,
  type,
}: StrategyExplorerProps) {
  const baseQuery = { ...query, risk: riskLevel, type, symbol, sortBy };

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
                href={buildHref(baseQuery, { risk: level, page: undefined })}
                key={level ?? "all-risk"}
              >
                {level ? `${riskLevelLabel(level)}风险` : "全部风险"}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="策略类型">
          {typeOptions.map((item) => {
            const active = item === type;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, { type: item, page: undefined })}
                key={item ?? "all-type"}
              >
                {strategyTypeLabel(item)}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="交易币种">
          {symbolOptions.map((item) => {
            const active = item === symbol;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, { symbol: item, page: undefined })}
                key={item ?? "all-symbol"}
              >
                {strategySymbolLabel(item)}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="排序">
          {sortOptions.map((item) => {
            const active = item.value === sortBy;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, {
                  sortBy: item.value,
                  page: undefined,
                })}
                key={item.label}
              >
                {item.label}
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
          <p>调整筛选条件后重新查看。筛选变化会自动回到第 1 页。</p>
        </div>
      )}
      <ListPagination
        ariaLabel="策略分页"
        basePath="/app/strategies"
        pagination={pagination}
        query={baseQuery}
      />
    </>
  );
}
