import Link from "next/link";

import { Button, Card, PageHeader } from "@quantflow/ui";

export default function PaperTradingPage() {
  return (
    <div className="app-page-stack">
      <PageHeader
        eyebrow="仅限模拟"
        title="模拟盘"
        description="用模拟余额观察策略执行过程。余额、订单、持仓、成交与权益均为模拟数据，不连接交易所或真实资产。"
        action={
          <Button disabled variant="secondary">
            创建模拟盘待接入
          </Button>
        }
      />
      <section className="paper-status-grid" aria-label="模拟盘能力说明">
        <Card className="paper-status-card">
          <span>模拟账户</span>
          <strong>独立模拟余额</strong>
          <p>模拟资金、持仓和成交与真实账户完全隔离，不读取交易所资产。</p>
        </Card>
        <Card className="paper-status-card">
          <span>风险监控</span>
          <strong>回撤与连亏记录</strong>
          <p>后续会记录权益曲线、最大回撤、连续亏损和风控触发历史。</p>
        </Card>
        <Card className="paper-status-card">
          <span>执行边界</span>
          <strong>不做真实下单</strong>
          <p>模拟盘只用于验证策略过程，不提供半自动或全自动交易入口。</p>
        </Card>
      </section>
      <div className="empty-state">
        <strong>还没有创建模拟盘</strong>
        <p>
          模拟盘创建能力接入后，可把订阅策略加入模拟账户，跟踪权益曲线、最大回撤、持仓和风险事件。
        </p>
        <Link className="primary-link" href="/app/strategies">
          先去选择策略
        </Link>
      </div>
    </div>
  );
}
