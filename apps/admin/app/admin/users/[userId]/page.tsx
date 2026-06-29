import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@quantflow/ui";

import { getAdminUserDetail } from "../../../../lib/governance-api";

type UserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: UserDetailPageProps) {
  const { userId } = await params;
  return { title: `${userId} · 用户详情` };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = await params;
  const response = await getAdminUserDetail(userId).catch(() => null);

  if (!response) {
    notFound();
  }

  const user = response.data;

  return (
    <>
      <PageHeader
        eyebrow="用户管理"
        title={user.email}
        description="查看会员、策略订阅、模拟盘、支付、邀请码、风险确认和最近审计记录。"
      />
      <section className="admin-detail-metrics" aria-label="用户概览">
        <Metric label="状态" value={statusLabel(user.status)} />
        <Metric
          label="会员"
          value={`${user.membershipPlanName} (${user.membershipTier})`}
        />
        <Metric label="模拟盘" value={`${user.paperAccountCount} 个`} />
        <Metric
          label="策略订阅"
          value={`${user.strategySubscriptionCount} 个`}
        />
      </section>

      <section className="admin-detail-grid">
        <DetailSection title="会员订阅">
          <SimpleTable
            empty="暂无会员订阅记录"
            headers={["计划", "状态", "来源", "开始", "结束"]}
            rows={user.subscriptions.map((item) => [
              item.planName,
              item.status,
              item.source,
              formatDate(item.startsAt),
              formatDate(item.endsAt),
            ])}
          />
        </DetailSection>

        <DetailSection title="策略订阅">
          <SimpleTable
            empty="暂无策略订阅"
            headers={["策略", "状态", "订阅时间", "取消时间"]}
            rows={user.strategySubscriptions.map((item) => [
              item.strategyName,
              item.status,
              formatDate(item.subscribedAt),
              item.cancelledAt ? formatDate(item.cancelledAt) : "—",
            ])}
          />
        </DetailSection>

        <DetailSection title="模拟盘">
          <SimpleTable
            empty="暂无模拟盘"
            headers={["名称", "策略", "币种", "状态", "权益", "最大回撤"]}
            rows={user.paperAccounts.map((item) => [
              item.name,
              item.strategyName,
              item.symbol,
              item.status,
              `${formatMoney(item.currentEquity)} USDT`,
              formatPercent(item.maxDrawdown),
            ])}
          />
        </DetailSection>

        <DetailSection title="支付记录">
          <SimpleTable
            empty="暂无支付记录"
            headers={["档位", "周期", "状态", "金额", "支付时间"]}
            rows={user.payments.map((item) => [
              item.tier,
              item.billingCycle,
              item.status,
              `¥${formatMoney(item.amountCny)}`,
              item.paidAt ? formatDate(item.paidAt) : "未支付",
            ])}
          />
        </DetailSection>

        <DetailSection title="邀请码兑换">
          <SimpleTable
            empty="暂无邀请码兑换"
            headers={["邀请码", "档位", "周期", "兑换时间"]}
            rows={user.inviteRedemptions.map((item) => [
              item.codeLabel,
              item.tier,
              item.billingCycle,
              formatDate(item.redeemedAt),
            ])}
          />
        </DetailSection>

        <DetailSection title="风险确认">
          <SimpleTable
            empty="暂无风险确认记录"
            headers={["场景", "版本", "确认时间"]}
            rows={user.riskAcceptances.map((item) => [
              riskContextLabel(item.context),
              item.disclosureVersion,
              formatDate(item.acceptedAt),
            ])}
          />
        </DetailSection>

        <DetailSection title="最近审计记录" wide>
          <SimpleTable
            empty="暂无审计记录"
            headers={["动作", "资源", "原因", "管理员", "时间"]}
            rows={user.auditLogs.map((item) => [
              item.action,
              item.resourceType,
              item.reason,
              item.actorEmail ?? "系统",
              formatDate(item.createdAt),
            ])}
          />
        </DetailSection>
      </section>

      <div className="admin-detail-footer">
        <Link className="admin-header-link" href="/admin/users">
          返回用户列表
        </Link>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailSection({
  children,
  title,
  wide,
}: {
  children: ReactNode;
  title: string;
  wide?: boolean;
}) {
  return (
    <section
      className={wide ? "admin-detail-card is-wide" : "admin-detail-card"}
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SimpleTable({
  empty,
  headers,
  rows,
}: {
  empty: string;
  headers: string[];
  rows: string[][];
}) {
  if (!rows.length) {
    return <p className="admin-detail-empty">{empty}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "active") {
    return "正常";
  }
  if (status === "disabled") {
    return "禁用";
  }
  if (status === "risk_watch") {
    return "风险观察";
  }
  return status;
}

function riskContextLabel(context: string) {
  const labels: Record<string, string> = {
    strategy_subscribe: "订阅策略",
    paper_account_create: "创建模拟盘",
    membership_checkout: "开通会员",
    membership_invite_redeem: "兑换邀请码",
  };
  return labels[context] ?? context;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: string) {
  return Number(value).toLocaleString("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatPercent(value: string) {
  return `${(Number(value) * 100).toFixed(2)}%`;
}
