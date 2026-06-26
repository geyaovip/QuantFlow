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
        description="这里展示你正在跟踪的策略。订阅只代表接收策略信号和查看记录，不代表收益承诺。"
      />
      <section className="app-hero-panel" aria-label="我的策略概览">
        <Card className="app-hero-card">
          <h2>把关注范围控制在可复核的数量内</h2>
          <p>
            建议优先跟踪你理解逻辑、能接受回撤、且有足够样本的策略。未订阅策略可回到策略广场继续筛选。
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
            <span>模拟盘</span>
            <strong>待接入</strong>
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
