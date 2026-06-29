import Link from "next/link";

import { Card, PageHeader } from "@quantflow/ui";

import {
  parsePage,
  parseRiskLevel,
  parseStrategyPeriod,
  parseStrategySymbol,
  parseStrategyType,
  USER_PAGE_SIZE,
} from "../../../lib/list-query";
import { getStrategies } from "../../../lib/strategy-api";
import { toStrategyCardRecord } from "../../../lib/strategy-format";
import { StrategyExplorer } from "./strategy-explorer";

export const metadata = { title: "策略广场" };

type StrategiesPageProps = {
  searchParams: Promise<{
    page?: string;
    risk?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
    symbol?: string;
    paper?: string;
    access?: string;
    period?: string;
  }>;
};

export default async function StrategiesPage({
  searchParams,
}: StrategiesPageProps) {
  const params = await searchParams;
  const riskLevel = parseRiskLevel(params.risk);
  const type = parseStrategyType(params.type);
  const symbol = parseStrategySymbol(params.symbol);
  const period = parseStrategyPeriod(params.period);
  const paperEnabled =
    params.paper === "true"
      ? true
      : params.paper === "false"
        ? false
        : undefined;
  const strategies = await getStrategies({
    page: parsePage(params.page),
    pageSize: USER_PAGE_SIZE,
    riskLevel,
    type,
    symbol,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    paperEnabled,
    access: params.access === "free" ? "free" : undefined,
    period:
      period ?? (params.sortBy === "returnRate" ? "thirty_days" : undefined),
  });
  const visibleCount = strategies.data.length;
  const activeFilterCount = [
    riskLevel,
    type,
    symbol,
    params.sortBy,
    params.paper,
    params.access,
    period,
  ].filter(Boolean).length;

  return (
    <>
      <PageHeader
        eyebrow="策略广场"
        title="发现可跟踪的策略"
        description="先看策略逻辑、风险等级和样本，再决定是否订阅信号或进入模拟验证。收益、最大回撤和交易样本始终并列展示。"
      />
      <section className="app-hero-panel" aria-label="策略广场概览">
        <Card className="app-hero-card">
          <h2>筛选策略前，先确认风险边界</h2>
          <p>
            当前列表仅展示已发布策略。高风险策略不会被隐藏，但会在卡片和详情页持续标记风险等级、回撤和失效场景。
          </p>
          <div className="app-hero-actions">
            <Link className="secondary-link" href="/app/signals">
              查看信号中心
            </Link>
            <Link className="secondary-link" href="/app/my-strategies">
              我的订阅
            </Link>
          </div>
        </Card>
        <div className="app-kpi-grid" aria-label="策略列表统计">
          <div>
            <span>当前筛选</span>
            <strong>
              {activeFilterCount ? `${activeFilterCount} 项` : "全部"}
            </strong>
          </div>
          <div>
            <span>本页展示</span>
            <strong>{visibleCount} 个</strong>
          </div>
          <div>
            <span>已入库策略</span>
            <strong>{strategies.pagination.total} 个</strong>
          </div>
        </div>
      </section>
      <StrategyExplorer
        access={params.access === "free" ? "free" : undefined}
        pagination={strategies.pagination}
        period={period}
        query={{
          risk: riskLevel,
          type,
          symbol,
          sortBy: params.sortBy,
          paper: params.paper,
          access: params.access,
          period: params.period,
        }}
        paperEnabled={paperEnabled}
        riskLevel={riskLevel}
        sortBy={params.sortBy}
        strategies={strategies.data.map(toStrategyCardRecord)}
        symbol={symbol}
        type={type}
      />
      <aside className="disclaimer">
        <strong>风险提示：</strong>QuantFlow
        不提供投资建议，不承诺任何收益。所有策略信号仅供参考，历史表现不代表未来收益。
      </aside>
    </>
  );
}
