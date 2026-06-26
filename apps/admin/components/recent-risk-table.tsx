import Link from "next/link";

import { Badge } from "@quantflow/ui";

const rows = [
  {
    event: "行情快照延迟",
    target: "BTCUSDT",
    level: "警告",
    time: "10:42",
    tone: "warning" as const,
  },
  {
    event: "策略回撤阈值",
    target: "ETH 波动突破",
    level: "高",
    time: "09:18",
    tone: "loss" as const,
  },
  {
    event: "样本数量不足",
    target: "SOL 均值观察",
    level: "提示",
    time: "昨天",
    tone: "info" as const,
  },
];

export function RecentRiskTable() {
  return (
    <section className="admin-table-card">
      <div className="admin-section-title">
        <div>
          <h2>最近风险事件</h2>
          <p>按事件时间倒序展示，默认每页 50 条，处理动作会写入审计日志。</p>
        </div>
        <Link href="/admin/risk">查看全部</Link>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>事件</th>
              <th>对象</th>
              <th>等级</th>
              <th>时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.event}-${row.target}`}>
                <td>{row.event}</td>
                <td>{row.target}</td>
                <td>
                  <Badge tone={row.tone}>{row.level}</Badge>
                </td>
                <td>{row.time}</td>
                <td>待处理</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span>第 1–3 条，共 3 条</span>
        <div>
          <button disabled>上一页</button>
          <button aria-current="page">1</button>
          <button disabled>下一页</button>
        </div>
      </div>
    </section>
  );
}
