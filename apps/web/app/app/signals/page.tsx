import { PageHeader } from "@quantflow/ui";

import {
  parsePage,
  parseSignalDirection,
  USER_PAGE_SIZE,
} from "../../../lib/list-query";
import { getSignals } from "../../../lib/strategy-api";
import { SignalExplorer } from "./signal-explorer";

type SignalsPageProps = {
  searchParams: Promise<{
    page?: string;
    direction?: string;
  }>;
};

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;
  const direction = parseSignalDirection(params.direction);
  const signals = await getSignals({
    page: parsePage(params.page),
    pageSize: USER_PAGE_SIZE,
    direction,
  });

  return (
    <div>
      <PageHeader
        eyebrow="信号中心"
        title="跟踪策略信号"
        description="这里展示你有权限查看的策略信号、触发价格、失效条件和风险状态。QuantFlow 不提供真实下单入口。"
      />
      <SignalExplorer direction={direction} signals={signals} />
    </div>
  );
}
