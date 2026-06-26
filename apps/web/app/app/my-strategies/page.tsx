import { PageHeader, StrategyCard } from "@quantflow/ui";

import { getMyStrategies } from "../../../lib/strategy-api";
import { toStrategyCardRecord } from "../../../lib/strategy-format";

export const metadata = { title: "我的策略" };

export default async function MyStrategiesPage() {
  const strategies = await getMyStrategies();

  return (
    <>
      <PageHeader
        eyebrow="我的策略"
        title="已订阅策略"
        description="这里展示你当前订阅的策略。Free 计划最多订阅 3 个活跃策略。"
      />
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
          <p>在策略详情页点击“订阅信号”后，会在这里看到对应策略。</p>
        </div>
      )}
    </>
  );
}
