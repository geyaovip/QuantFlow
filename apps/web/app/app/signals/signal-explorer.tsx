import Link from "next/link";

import type { SignalDirection } from "@quantflow/contracts";
import { Badge, Button, Card, RiskBadge } from "@quantflow/ui";

import { ListPagination } from "../../../components/list-pagination";
import { signalDirectionLabel } from "../../../lib/list-query";
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
};

const directionOptions: Array<SignalDirection | undefined> = [
  undefined,
  "buy",
  "sell",
  "watch",
];

function buildDirectionHref(direction: SignalDirection | undefined) {
  return direction ? `/app/signals?direction=${direction}` : "/app/signals";
}

export function SignalExplorer({ direction, signals }: SignalExplorerProps) {
  const query = direction ? { direction } : {};

  return (
    <>
      <div className="filter-bar" aria-label="信号筛选">
        <div className="filter-group" role="group" aria-label="信号方向">
          {directionOptions.map((item) => {
            const active = item === direction;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "filter-chip is-active" : "filter-chip"}
                href={buildDirectionHref(item)}
                key={item ?? "all"}
              >
                {signalDirectionLabel(item)}
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
                <Button disabled>加入模拟盘待接入</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>当前没有可展示的信号</strong>
          <p>
            当已关注策略产生有效信号后，会在这里显示方向、价格区间、有效期和风险等级。
          </p>
        </div>
      )}
      <ListPagination
        ariaLabel="信号分页"
        basePath="/app/signals"
        pagination={signals.pagination}
        query={query}
      />
    </>
  );
}
