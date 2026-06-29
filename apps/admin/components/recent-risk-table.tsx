import Link from "next/link";

import { Badge } from "@quantflow/ui";

import type { AdminRiskEvent } from "@quantflow/contracts";

type RecentRiskTableProps = {
  events?: AdminRiskEvent[];
};

export function RecentRiskTable({ events = [] }: RecentRiskTableProps) {
  return (
    <section className="admin-table-card">
      <div className="admin-section-title">
        <div>
          <h2>最近风险事件</h2>
          <p>按事件时间倒序展示，优先处理未关闭事件。</p>
        </div>
        <Link href="/admin/risk">查看全部</Link>
      </div>
      {events.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>事件</th>
                <th>等级</th>
                <th>时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 5).map((event) => (
                <tr key={event.id}>
                  <td>{event.message}</td>
                  <td>
                    <Badge
                      tone={
                        event.level === "critical" || event.level === "high"
                          ? "loss"
                          : "warning"
                      }
                    >
                      {event.level}
                    </Badge>
                  </td>
                  <td>{new Date(event.createdAt).toLocaleString("zh-CN")}</td>
                  <td>{event.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <strong>暂无风险事件</strong>
          <span>信号异常与模拟盘风险会汇总到这里。</span>
        </div>
      )}
    </section>
  );
}
