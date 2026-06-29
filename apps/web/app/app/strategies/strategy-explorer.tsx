import Link from "next/link";

import type { Pagination, RiskLevel, StrategyType } from "@quantflow/contracts";
import { StrategyCard } from "@quantflow/ui";

import { ListPagination } from "../../../components/list-pagination";
import type { StrategyCardRecord } from "../../../lib/strategy-format";
import {
  riskLevelLabel,
  strategyPeriodLabel,
  strategySymbolLabel,
  strategyTypeLabel,
  type StrategyMetricPeriod,
} from "../../../lib/list-query";

type StrategyExplorerProps = {
  access?: string;
  pagination: Pagination;
  period?: StrategyMetricPeriod;
  query: Record<string, string | undefined>;
  riskLevel?: RiskLevel;
  sortBy?: string;
  strategies: StrategyCardRecord[];
  symbol?: string;
  type?: StrategyType;
  paperEnabled?: boolean;
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
  { sortBy: undefined, period: undefined, label: "最新上线" },
  { sortBy: "recommended", period: "thirty_days", label: "综合推荐" },
  { sortBy: "subscriberCount", period: undefined, label: "订阅人数" },
  { sortBy: "returnRate", period: "seven_days", label: "近 7 日表现" },
  { sortBy: "returnRate", period: "thirty_days", label: "近 30 日表现" },
  { sortBy: "maxDrawdown", period: "thirty_days", label: "最大回撤" },
  { sortBy: "riskLevel", period: undefined, label: "风险等级" },
] as const;

const periodOptions: Array<StrategyMetricPeriod | undefined> = [
  undefined,
  "seven_days",
  "thirty_days",
  "ninety_days",
  "all_time",
];

const accessOptions = [
  { value: undefined, label: "全部权限" },
  { value: "free", label: "免费策略" },
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

const paperOptions = [
  { value: undefined, label: "全部策略" },
  { value: "true", label: "支持模拟盘" },
  { value: "false", label: "仅信号" },
] as const;

export function StrategyExplorer({
  access,
  pagination,
  period,
  query,
  riskLevel,
  sortBy,
  strategies,
  symbol,
  type,
  paperEnabled,
}: StrategyExplorerProps) {
  const baseQuery = {
    ...query,
    risk: riskLevel,
    type,
    symbol,
    sortBy,
    access,
    period,
  };
  const paperValue =
    paperEnabled === true
      ? "true"
      : paperEnabled === false
        ? "false"
        : undefined;

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
        <div className="filter-group" role="group" aria-label="模拟盘支持">
          {paperOptions.map((item) => {
            const active = item.value === paperValue;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, {
                  paper: item.value,
                  page: undefined,
                })}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="收益周期">
          {periodOptions.map((item) => {
            const active = item === period;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, { period: item, page: undefined })}
                key={item ?? "default-period"}
              >
                {strategyPeriodLabel(item)}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="访问权限">
          {accessOptions.map((item) => {
            const active = item.value === access;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, {
                  access: item.value,
                  page: undefined,
                })}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="排序">
          {sortOptions.map((item) => {
            const active =
              item.sortBy === sortBy &&
              (item.period ?? undefined) === (period ?? undefined);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, {
                  sortBy: item.sortBy,
                  period: item.period,
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
