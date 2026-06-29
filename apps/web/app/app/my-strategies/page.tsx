import Link from "next/link";

import { Card, PageHeader, StrategyCard } from "@quantflow/ui";

import { getMyStrategies } from "../../../lib/strategy-api";
import { toStrategyCardRecord } from "../../../lib/strategy-format";

export const metadata = { title: "我的策略" };

export default async function MyStrategiesPage() {
  const strategies = await getMyStrategies();
  const activeCount = strategies.pagination.total;

  return (
    <>
      <PageHeader
        eyebrow="我的策略"
        title="已订阅策略"
        description="查看正在跟踪的策略、订阅容量和可进入的信号记录。"
      />
      <section className="app-hero-panel" aria-label="我的策略概览">
        <Card className="app-hero-card">
          <h2>保留可复核的订阅范围</h2>
          <p>
            优先跟踪逻辑清晰、回撤可接受、样本量足够的策略。需要更多选择时回到策略广场筛选。
          </p>
          <div className="app-hero-actions">
            <Link className="secondary-link" href="/app/strategies">
              浏览更多策略
            </Link>
            <Link className="secondary-link" href="/app/signals">
              查看信号中心
            </Link>
          </div>
        </Card>
        <div className="app-kpi-grid" aria-label="订阅策略统计">
          <div>
            <span>已订阅</span>
            <strong>{activeCount} 个</strong>
          </div>
          <div>
            <span>订阅策略</span>
            <strong>已同步</strong>
          </div>
          <div>
            <span>模拟验证</span>
            <strong>可从信号创建</strong>
          </div>
        </div>
      </section>
      {strategies.data.length ? (
        <div className="strategy-grid">
          {strategies.data.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              {...toStrategyCardRecord(strategy)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>暂无订阅策略</strong>
          <p>
            在策略详情页点击“订阅信号”后，会在这里看到对应策略。建议先比较风险等级、最大回撤和样本量。
          </p>
          <Link className="primary-link" href="/app/strategies">
            去策略广场
          </Link>
        </div>
      )}
    </>
  );
}
