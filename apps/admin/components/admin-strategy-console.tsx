"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  AdminStrategyCreate,
  StrategyListItem,
} from "@quantflow/contracts";

type AdminStrategyConsoleProps = {
  apiBaseUrl: string;
  strategies: StrategyListItem[];
};

const defaultDraft: AdminStrategyCreate = {
  slug: "",
  name: "",
  summary: "",
  type: "trend",
  riskLevel: "medium",
  requiredTier: "free",
  symbols: ["BTCUSDT"],
  logic: "",
  suitableMarket: "",
  unsuitableMarket: "",
  positionSizing: "单个模拟信号建议仓位不超过 10%，不使用杠杆。",
  stopLossLogic: "",
  takeProfitLogic: "",
  failureModes: "",
  reason: "管理端创建策略草稿",
};

export function AdminStrategyConsole({
  apiBaseUrl,
  strategies,
}: AdminStrategyConsoleProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(defaultDraft);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const createStrategy = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/strategies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...draft,
          symbols: draft.symbols
            .join(",")
            .split(",")
            .map((symbol) => symbol.trim().toUpperCase())
            .filter(Boolean),
        }),
      });
      if (!response.ok) {
        throw new Error("create failed");
      }
      setDraft(defaultDraft);
      setShowCreate(false);
      setMessage("策略草稿已创建。");
      router.refresh();
    } catch {
      setError("创建失败，请检查必填字段和 slug 是否重复。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAction = async (strategyId: string, action: string) => {
    const reason = window.prompt("请输入操作原因");
    if (!reason) {
      return;
    }

    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/admin/strategies/${strategyId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        },
      );
      if (!response.ok) {
        throw new Error("action failed");
      }
      setMessage("操作已完成并写入审计。");
      router.refresh();
    } catch {
      setError("操作失败，请确认策略状态是否允许该动作。");
    }
  };

  return (
    <div className="admin-strategy-console">
      <div className="admin-console__toolbar">
        <div>
          <strong>策略运营</strong>
          <span>列表优先处理审核、暂停和下架；创建草稿按需展开。</span>
        </div>
        <button onClick={() => setShowCreate((value) => !value)} type="button">
          {showCreate ? "收起创建" : "新建策略"}
        </button>
      </div>
      {showCreate ? (
        <section className="admin-form-card" aria-label="创建策略草稿">
          <div className="admin-section-title">
            <div>
              <h2>创建策略草稿</h2>
              <p>填写策略基础信息，审核通过后进入用户端展示。</p>
            </div>
            <button
              disabled={isSubmitting}
              onClick={() => void createStrategy()}
              type="button"
            >
              {isSubmitting ? "创建中..." : "创建草稿"}
            </button>
          </div>
          <div className="admin-form-grid">
            <label>
              Slug
              <input
                onChange={(event) =>
                  setDraft({ ...draft, slug: event.target.value })
                }
                placeholder="btc-trend-v2"
                value={draft.slug}
              />
            </label>
            <label>
              名称
              <input
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="BTC 趋势过滤 V2"
                value={draft.name}
              />
            </label>
            <label>
              币种
              <input
                onChange={(event) =>
                  setDraft({ ...draft, symbols: [event.target.value] })
                }
                placeholder="BTCUSDT,ETHUSDT"
                value={draft.symbols.join(",")}
              />
            </label>
            <label>
              风险等级
              <select
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    riskLevel: event.target
                      .value as AdminStrategyCreate["riskLevel"],
                  })
                }
                value={draft.riskLevel}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </label>
            <label className="admin-form-grid__wide">
              摘要
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, summary: event.target.value })
                }
                value={draft.summary}
              />
            </label>
            <label className="admin-form-grid__wide">
              策略逻辑
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, logic: event.target.value })
                }
                value={draft.logic}
              />
            </label>
            <label>
              适合行情
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, suitableMarket: event.target.value })
                }
                value={draft.suitableMarket}
              />
            </label>
            <label>
              不适合行情
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, unsuitableMarket: event.target.value })
                }
                value={draft.unsuitableMarket}
              />
            </label>
            <label>
              止损逻辑
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, stopLossLogic: event.target.value })
                }
                value={draft.stopLossLogic}
              />
            </label>
            <label>
              止盈逻辑
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, takeProfitLogic: event.target.value })
                }
                value={draft.takeProfitLogic}
              />
            </label>
            <label className="admin-form-grid__wide">
              失效场景
              <textarea
                onChange={(event) =>
                  setDraft({ ...draft, failureModes: event.target.value })
                }
                value={draft.failureModes}
              />
            </label>
          </div>
          {message ? <p className="admin-message">{message}</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}
        </section>
      ) : (
        <>
          {message ? <p className="admin-message">{message}</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}
        </>
      )}

      <section className="admin-table-card">
        <div className="admin-section-title">
          <div>
            <h2>策略列表</h2>
            <p>处理提审、批准、拒绝、暂停和下架。</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>策略</th>
                <th>状态</th>
                <th>风险</th>
                <th>权益</th>
                <th>近 90 天收益 / 回撤</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => (
                <tr key={strategy.id}>
                  <td>
                    <strong>{strategy.name}</strong>
                    <br />
                    <span>{strategy.slug}</span>
                  </td>
                  <td>{formatStatus(strategy.status)}</td>
                  <td>{formatRisk(strategy.riskLevel)}</td>
                  <td>{strategy.requiredTier}</td>
                  <td>
                    {formatPercent(strategy.metric.returnRate)} /{" "}
                    {formatPercent(strategy.metric.maxDrawdown)}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        onClick={() =>
                          void runAction(strategy.id, "submit-review")
                        }
                        type="button"
                      >
                        提审
                      </button>
                      <button
                        onClick={() => void runAction(strategy.id, "approve")}
                        type="button"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => void runAction(strategy.id, "reject")}
                        type="button"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => void runAction(strategy.id, "pause")}
                        type="button"
                      >
                        暂停
                      </button>
                      <button
                        onClick={() => void runAction(strategy.id, "delist")}
                        type="button"
                      >
                        下架
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatStatus(status: StrategyListItem["status"]) {
  const labels: Record<StrategyListItem["status"], string> = {
    draft: "草稿",
    pending_review: "待审核",
    active: "已上线",
    paused: "已暂停",
    risk_watch: "风险观察",
    delisted: "已下架",
  };
  return labels[status];
}

function formatRisk(risk: StrategyListItem["riskLevel"]) {
  const labels: Record<StrategyListItem["riskLevel"], string> = {
    low: "低",
    medium: "中",
    high: "高",
    critical: "严重",
  };
  return labels[risk];
}

function formatPercent(value: string) {
  return `${(Number(value) * 100).toFixed(1)}%`;
}
