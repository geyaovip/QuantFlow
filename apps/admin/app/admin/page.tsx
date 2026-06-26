import Link from "next/link";

import { MetricCard, PageHeader } from "@quantflow/ui";

import { RecentRiskTable } from "../../components/recent-risk-table";

export const metadata = { title: "数据看板" };

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="运营总览"
        title="数据看板"
        description="聚合用户、策略、模拟盘与风险状态。敏感操作需要管理员权限并写入审计日志。"
        action={
          <Link className="admin-header-link" href="/admin/strategies">
            查看策略
          </Link>
        }
      />
      <section className="admin-metric-grid" aria-label="核心指标">
        <MetricCard
          label="活跃策略"
          value="12"
          supportingLabel="高风险策略"
          supportingValue="2"
        />
        <MetricCard
          label="今日信号"
          value="28"
          supportingLabel="异常 / 取消"
          supportingValue="1 / 2"
        />
        <MetricCard
          label="模拟盘"
          value="186"
          supportingLabel="风险事件"
          supportingValue="7"
        />
        <MetricCard
          label="注册用户"
          value="1,248"
          supportingLabel="今日新增"
          supportingValue="+32"
          valueTone="profit"
        />
      </section>
      <RecentRiskTable />
    </>
  );
}
