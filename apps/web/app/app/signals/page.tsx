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
  }>;
};

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;
  const direction = parseSignalDirection(params.direction);
  const status = parseSignalStatus(params.status);
  const signals = await getSignals({
    page: parsePage(params.page),
    pageSize: USER_PAGE_SIZE,
    direction,
    status,
  });
  const activeFilterCount = [direction, status].filter(Boolean).length;

  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="信号中心"
        title="跟踪可解释信号"
        description="每条信号都带触发价格、有效期、风险等级和失效条件。QuantFlow 不提供真实下单入口。"
      />
      <section className="app-hero-panel" aria-label="信号中心概览">
        <Card className="app-hero-card">
          <h2>信号用于观察和模拟，不是交易指令</h2>
          <p>
            先确认策略来源、有效期和当前价格快照，再决定是否进入策略详情或等待模拟盘能力接入。
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
      <SignalExplorer direction={direction} signals={signals} status={status} />
    </div>
  );
}
