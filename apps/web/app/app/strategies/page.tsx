import { PageHeader } from "@quantflow/ui";

import { StrategyExplorer } from "./strategy-explorer";

export const metadata = { title: "策略广场" };

export default function StrategiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="策略广场"
        title="浏览已入库策略"
        description="按风险等级查看可观察策略。收益、最大回撤、样本量和盈亏比以同一周期并列展示，避免只看单一收益排序。"
      />
      <StrategyExplorer />
      <aside className="disclaimer">
        QuantFlow
        不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。
      </aside>
    </>
  );
}
