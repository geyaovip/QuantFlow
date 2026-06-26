import { PageHeader } from "@quantflow/ui";

import { getAdminSignals } from "../../../lib/strategy-api";

export default async function SignalsPage() {
  const signals = await getAdminSignals();

  return (
    <>
      <PageHeader
        eyebrow="信号治理"
        title="信号管理"
        description="信号发布、取消和异常标记必须经过权限校验并写入审计日志。"
      />
      {signals.data.length ? (
        <section className="admin-table-card">
          <div className="admin-section-title">
            <div>
              <h2>信号记录</h2>
              <p>当前展示 active 信号；取消和异常标记将在后续风控切片接入。</p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>策略</th>
                  <th>币种</th>
                  <th>方向</th>
                  <th>状态</th>
                  <th>风险</th>
                  <th>生成时间</th>
                </tr>
              </thead>
              <tbody>
                {signals.data.map((signal) => (
                  <tr key={signal.id}>
                    <td>{signal.strategyName}</td>
                    <td>{signal.symbol}</td>
                    <td>{signal.direction}</td>
                    <td>{signal.status}</td>
                    <td>{signal.riskLevel}</td>
                    <td>
                      {new Date(signal.generatedAt).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="admin-empty">
          <strong>暂无信号记录</strong>
          <span>
            信号产生后会在这里展示策略、币种、状态、风险等级和处理记录。
          </span>
        </div>
      )}
    </>
  );
}
