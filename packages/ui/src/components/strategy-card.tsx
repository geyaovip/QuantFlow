import { ArrowRight } from "lucide-react";

import { Badge, RiskBadge } from "./badge";
import { Card } from "./card";

export type StrategyCardProps = {
  currentSignalLabel?: string;
  href?: string;
  name: string;
  summary: string;
  market: string;
  periodReturn: string;
  maxDrawdown: string;
  winRate: string;
  trades: number;
  profitLossRatio: string;
  risk: "低" | "中" | "高";
  statusLabel?: string;
  updatedAt?: string;
};

export function StrategyCard(props: StrategyCardProps) {
  return (
    <Card className="qf-strategy-card">
      <div className="qf-strategy-card__topline">
        <Badge>{props.market}</Badge>
        <RiskBadge level={props.risk} />
      </div>
      <div>
        <h2>{props.name}</h2>
        <p>{props.summary}</p>
      </div>
      <dl className="qf-strategy-metrics">
        <div>
          <dt>近 90 天收益</dt>
          <dd className="qf-profit">{props.periodReturn}</dd>
        </div>
        <div>
          <dt>最大回撤</dt>
          <dd>{props.maxDrawdown}</dd>
        </div>
        <div>
          <dt>胜率 / 交易数</dt>
          <dd>
            {props.winRate} / {props.trades}
          </dd>
        </div>
        <div>
          <dt>盈亏比</dt>
          <dd>{props.profitLossRatio}</dd>
        </div>
      </dl>
      {props.currentSignalLabel || props.statusLabel || props.updatedAt ? (
        <div className="qf-strategy-card__signal" aria-label="当前信号状态">
          <span>
            当前信号
            <strong>{props.currentSignalLabel ?? "暂无信号"}</strong>
          </span>
          <span>
            状态
            <strong>{props.statusLabel ?? "待更新"}</strong>
          </span>
          {props.updatedAt ? (
            <span>
              更新
              <strong>{props.updatedAt}</strong>
            </span>
          ) : null}
        </div>
      ) : null}
      {props.href ? (
        <a className="qf-card-link" href={props.href}>
          查看策略与风险 <ArrowRight aria-hidden="true" size={16} />
        </a>
      ) : (
        <span className="qf-card-link qf-card-link--muted">
          详情访问需开通 <ArrowRight aria-hidden="true" size={16} />
        </span>
      )}
    </Card>
  );
}
