import Link from "next/link";

import type { SignalDirection, SignalStatus } from "@quantflow/contracts";
import { Badge, Button, Card, RiskBadge } from "@quantflow/ui";

import { ListPagination } from "../../../components/list-pagination";
import {
  signalDirectionLabel,
  signalStatusLabel,
} from "../../../lib/list-query";
import {
  formatDateTime,
  formatPositionPct,
  formatPrice,
  formatRiskLevel,
  formatSignalDirection,
  formatSignalStatus,
} from "../../../lib/strategy-format";
import type { SignalListResponse } from "@quantflow/contracts";

type SignalExplorerProps = {
  direction?: SignalDirection;
  signals: SignalListResponse;
  status?: SignalStatus;
  usedInPaper?: boolean;
};

const directionOptions: Array<SignalDirection | undefined> = [
  undefined,
  "buy",
  "sell",
  "watch",
];

const statusOptions: Array<SignalStatus | undefined> = [
  undefined,
  "active",
  "expired",
  "cancelled",
  "strategy_paused",
  "risk_blocked",
];

const usedInPaperOptions = [
  { value: undefined, label: "全部模拟" },
  { value: "false", label: "未用于模拟" },
  { value: "true", label: "已用于模拟" },
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
  return search ? `/app/signals?${search}` : "/app/signals";
}

export function SignalExplorer({
  direction,
  signals,
  status,
  usedInPaper,
}: SignalExplorerProps) {
  const usedInPaperValue =
    usedInPaper === true ? "true" : usedInPaper === false ? "false" : undefined;
  const baseQuery = { direction, status, usedInPaper: usedInPaperValue };

  return (
    <>
      <div className="filter-bar" aria-label="信号筛选">
        <div className="filter-group" role="group" aria-label="信号方向">
          <span className="filter-label">方向</span>
          {directionOptions.map((item) => {
            const active = item === direction;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, {
                  direction: item,
                  page: undefined,
                })}
                key={item ?? "all-direction"}
              >
                {signalDirectionLabel(item)}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="信号状态">
          <span className="filter-label">状态</span>
          {statusOptions.map((item) => {
            const active = item === status;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, { status: item, page: undefined })}
                key={item ?? "all-status"}
              >
                {signalStatusLabel(item)}
              </Link>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-label="模拟使用">
          <span className="filter-label">模拟</span>
          {usedInPaperOptions.map((item) => {
            const active = item.value === usedInPaperValue;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildHref(baseQuery, {
                  usedInPaper: item.value,
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
          每页 {signals.pagination.pageSize} 条 · 共 {signals.pagination.total}{" "}
          条信号 · 第 {signals.pagination.page} /{" "}
          {signals.pagination.totalPages} 页
        </span>
      </div>
      {signals.data.length ? (
        <div className="signal-list" aria-label="策略信号列表">
          {signals.data.map((signal) => (
            <Card className="signal-card" key={signal.id}>
              <div className="signal-card__topline">
                <div>
                  <Badge>{signal.symbol}</Badge>
                  <RiskBadge level={formatRiskLevel(signal.riskLevel)} />
                </div>
                <span>{formatSignalStatus(signal.status)}</span>
              </div>
              <div className="signal-card__body">
                <div>
                  <p>{signal.strategyName}</p>
                  <h2>{formatSignalDirection(signal.direction)}</h2>
                  <span>
                    生成：{formatDateTime(signal.generatedAt)} · 有效至：
                    {formatDateTime(signal.validUntil)}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>触发价格</dt>
                    <dd>{formatPrice(signal.triggerPrice)}</dd>
                  </div>
                  <div>
                    <dt>当前快照</dt>
                    <dd>{formatPrice(signal.currentPriceSnapshot)}</dd>
                  </div>
                  <div>
                    <dt>建议仓位</dt>
                    <dd>{formatPositionPct(signal.suggestedPositionPct)}</dd>
                  </div>
                  <div>
                    <dt>止损 / 止盈</dt>
                    <dd>
                      {formatPrice(signal.stopLossPrice)} /{" "}
                      {formatPrice(signal.takeProfitPrice)}
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="signal-card__rationale">{signal.rationale}</p>
              <div className="signal-card__actions">
                <Link
                  className="primary-link"
                  href={`/app/signals/${signal.id}`}
                >
                  查看信号详情
                </Link>
                <Link
                  className="secondary-link"
                  href={`/app/strategies/${signal.strategySlug}`}
                >
                  查看策略
                </Link>
                {signal.status === "active" ? (
                  <Link
                    className="secondary-link"
                    href={`/app/signals/${signal.id}#paper-create`}
                  >
                    加入模拟盘
                  </Link>
                ) : (
                  <Button disabled variant="secondary">
                    当前状态不可模拟
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>当前没有可展示的信号</strong>
          <p>
            当已订阅策略产生可见信号后，会在这里显示方向、价格区间、有效期和风险等级。
          </p>
          <div className="empty-state__actions">
            <Link className="primary-link" href="/app/strategies">
              去订阅策略
            </Link>
            <Link className="secondary-link" href="/app/membership">
              查看会员权限
            </Link>
          </div>
        </div>
      )}
      <ListPagination
        ariaLabel="信号分页"
        basePath="/app/signals"
        pagination={signals.pagination}
        query={baseQuery}
      />
    </>
  );
}
