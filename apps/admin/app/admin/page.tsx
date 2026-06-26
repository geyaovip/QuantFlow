import { MetricCard, PageHeader } from "@quantflow/ui";
import Link from "next/link";

import { RecentRiskTable } from "../../components/recent-risk-table";
import {
  getAdminDashboard,
  getAdminRiskEvents,
} from "../../lib/governance-api";

export const metadata = { title: "数据看板" };

export default async function AdminDashboardPage() {
  const [summary, risks] = await Promise.all([
    getAdminDashboard().catch(() => ({
      data: {
        userCount: 0,
        activeStrategyCount: 0,
        signalCountToday: 0,
        paperAccountCount: 0,
        openRiskEventCount: 0,
      },
    })),
    getAdminRiskEvents(1, 5).catch(() => ({
      data: [],
      pagination: { page: 1, pageSize: 5, total: 0, totalPages: 1 },
    })),
  ]);

  const metrics = summary.data;

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
          value={String(metrics.activeStrategyCount)}
          supportingLabel="注册用户"
          supportingValue={String(metrics.userCount)}
        />
        <MetricCard
          label="今日信号"
          value={String(metrics.signalCountToday)}
          supportingLabel="待处理风险"
          supportingValue={String(metrics.openRiskEventCount)}
        />
        <MetricCard
          label="模拟盘"
          value={String(metrics.paperAccountCount)}
          supportingLabel="数据来源"
          supportingValue="实时 API"
        />
        <MetricCard
          label="注册用户"
          value={String(metrics.userCount)}
          supportingLabel="管理入口"
          supportingValue="用户 / 会员"
          valueTone="profit"
        />
      </section>
      <RecentRiskTable events={risks.data} />
    </>
  );
}
