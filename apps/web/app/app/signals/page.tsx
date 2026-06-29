import Link from "next/link";

import { Card, PageHeader } from "@quantflow/ui";

import {
  parsePage,
  parseSignalDirection,
  parseSignalStatus,
  USER_PAGE_SIZE,
} from "../../../lib/list-query";
import { getSignals } from "../../../lib/strategy-api";
import { SignalExplorer } from "./signal-explorer";

type SignalsPageProps = {
  searchParams: Promise<{
    page?: string;
    direction?: string;
    status?: string;
    usedInPaper?: string;
  }>;
};

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;
  const direction = parseSignalDirection(params.direction);
  const status = parseSignalStatus(params.status);
  const usedInPaper =
    params.usedInPaper === "true"
      ? true
      : params.usedInPaper === "false"
        ? false
        : undefined;
  const signals = await getSignals({
    page: parsePage(params.page),
    pageSize: USER_PAGE_SIZE,
    direction,
    status,
    usedInPaper,
  });
  const activeFilterCount = [direction, status, params.usedInPaper].filter(
    Boolean,
  ).length;

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="信号中心"
        title="信号中心"
        description="查看触发价格、有效期、风险等级和失效条件。信号仅用于观察和模拟验证。"
      />
      <section className="app-hero-panel" aria-label="信号中心概览">
        <Card className="app-hero-card">
          <h2>先确认状态，再加入模拟</h2>
          <p>
            先确认策略来源、有效期和当前价格快照，再决定查看详情或创建模拟盘。
          </p>
          <div className="app-hero-actions">
            <Link className="secondary-link" href="/app/strategies">
              返回策略广场
            </Link>
            <Link className="secondary-link" href="/app/my-strategies">
              查看订阅策略
            </Link>
          </div>
        </Card>
        <div className="app-kpi-grid" aria-label="信号列表统计">
          <div>
            <span>当前筛选</span>
            <strong>
              {activeFilterCount ? `${activeFilterCount} 项` : "全部"}
            </strong>
          </div>
          <div>
            <span>本页展示</span>
            <strong>{signals.data.length} 条</strong>
          </div>
          <div>
            <span>可见信号</span>
            <strong>{signals.pagination.total} 条</strong>
          </div>
        </div>
      </section>
      <SignalExplorer
        direction={direction}
        signals={signals}
        status={status}
        usedInPaper={usedInPaper}
      />
    </div>
  );
}
