import Link from "next/link";

import type { AdminMembershipPayment } from "@quantflow/contracts";

type AdminPaymentAuditTableProps = {
  payments: AdminMembershipPayment[];
};

export function AdminPaymentAuditTable({
  payments,
}: AdminPaymentAuditTableProps) {
  if (!payments.length) {
    return (
      <div className="admin-empty">
        <strong>暂无生产支付记录</strong>
        <span>用户创建生产支付订单后，会在这里显示支付状态和核查入口。</span>
      </div>
    );
  }

  return (
    <section className="admin-table-card">
      <div className="admin-section-title">
        <div>
          <h2>生产支付核查</h2>
          <p>只读查看支付订单状态；MVP 不提供退款或手动确认支付。</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>计划</th>
              <th>状态</th>
              <th>金额</th>
              <th>Invoice</th>
              <th>创建 / 支付时间</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.userEmail}</td>
                <td>
                  {payment.planName} · {payment.billingCycle}
                </td>
                <td>{payment.status}</td>
                <td>${formatMoney(payment.amountUsd)}</td>
                <td>
                  {payment.invoiceUrl ? (
                    <Link
                      className="admin-table-link"
                      href={payment.invoiceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      查看
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {formatDate(payment.createdAt)}
                  <br />
                  {payment.paidAt ? formatDate(payment.paidAt) : "未支付"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
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
