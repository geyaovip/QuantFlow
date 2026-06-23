import { Button, PageHeader } from "@quantflow/ui";

import { StrategyExplorer } from "./strategy-explorer";

export const metadata = { title: "策略广场" };

export default function StrategiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="策略广场"
        title="寻找适合观察的策略"
        description="所有策略同时展示收益与风险。当前数据为产品骨架中的模拟示例，不代表真实或未来表现。"
        action={<Button variant="secondary">了解指标口径</Button>}
      />
      <StrategyExplorer />
      <aside className="disclaimer">
        QuantFlow
        不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。
      </aside>
    </>
  );
}
