import {
  ArrowRight,
  BellRing,
  ChartSpline,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { Badge, Card, RiskBadge } from "@quantflow/ui";

import { MarketingHeader } from "../components/marketing-header";

const disclaimer =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

export default function MarketingPage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <section className="hero">
          <div className="hero__copy">
            <Badge tone="info">策略信号 · 风险并列 · 模拟验证</Badge>
            <h1>
              用清晰的数据，
              <br />
              验证每一个策略判断。
            </h1>
            <p>
              QuantFlow
              汇总策略信号、风险指标与模拟盘表现，帮助你在不连接交易所、不触碰真实资产的前提下完成观察和验证。
            </p>
            <div className="hero__actions">
              <Link className="primary-link" href="/app/strategies">
                进入应用 <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <a className="secondary-link" href="#risk">
                先了解风险原则
              </a>
            </div>
          </div>
          <Card className="hero-panel" aria-label="策略概览示例">
            <div className="hero-panel__header">
              <div>
                <span>策略观察</span>
                <strong>BTC 趋势过滤</strong>
              </div>
              <RiskBadge level="中" />
            </div>
            <div className="hero-chart" aria-label="图表空状态">
              <span>行情与模拟权益图表将在数据接入后显示</span>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>近 90 天收益</dt>
                <dd className="positive">+12.8%</dd>
              </div>
              <div>
                <dt>最大回撤</dt>
                <dd>-6.4%</dd>
              </div>
              <div>
                <dt>胜率 / 样本</dt>
                <dd>58.2% / 67</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section id="features" className="section-block">
          <div className="section-heading">
            <p>核心能力</p>
            <h2>从发现策略到模拟验证，信息始终成对出现。</h2>
          </div>
          <div className="feature-grid">
            {[
              [
                ChartSpline,
                "策略与信号",
                "用统一口径查看策略逻辑、信号状态、收益与风险，不只看单一排名。",
              ],
              [
                WalletCards,
                "模拟盘",
                "使用模拟余额验证策略过程，所有订单、持仓和权益都明确标记为模拟。",
              ],
              [
                ShieldCheck,
                "风险控制",
                "最大回撤、连续亏损、行情延迟和样本不足都有明确提示与事件记录。",
              ],
              [
                BellRing,
                "提醒与跟踪",
                "收藏策略、查看信号和风险事件；第一版以站内通知和轮询为主。",
              ],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof ChartSpline;
              return (
                <Card className="feature-card" key={String(title)}>
                  <FeatureIcon aria-hidden="true" />
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="strategies" className="section-block strategy-preview">
          <div className="section-heading">
            <p>策略示例</p>
            <h2>收益数据旁边，永远放着对应风险。</h2>
          </div>
          <div className="preview-table" role="table" aria-label="策略预览">
            <div className="preview-row preview-row--header" role="row">
              <span>策略</span>
              <span>近 90 天收益</span>
              <span>最大回撤</span>
              <span>风险</span>
            </div>
            {[
              ["BTC 趋势过滤", "+12.8%", "-6.4%", "中"],
              ["ETH 波动突破", "+8.6%", "-4.9%", "中"],
              ["SOL 均值观察", "+5.1%", "-3.2%", "低"],
            ].map(([name, value, drawdown, risk]) => (
              <div className="preview-row" role="row" key={name}>
                <strong>{name}</strong>
                <span className="positive">{value}</span>
                <span>{drawdown}</span>
                <RiskBadge level={risk as "低" | "中" | "高"} />
              </div>
            ))}
          </div>
        </section>

        <section id="risk" className="risk-section">
          <div>
            <p>风险原则</p>
            <h2>先理解风险，再使用工具。</h2>
          </div>
          <p>{disclaimer}</p>
        </section>

        <section id="membership" className="section-block membership-block">
          <div className="section-heading">
            <p>会员权益</p>
            <h2>为数据范围、提醒和模拟容量付费，而不是为收益预期付费。</h2>
          </div>
          <div className="membership-note">
            MVP 暂未开放在线购买。会员由管理员、邀请码或测试流程开通。
          </div>
        </section>
      </main>
      <footer>
        <span>© 2026 QuantFlow</span>
        <span>策略信号仅供参考 · 不承诺任何收益</span>
      </footer>
    </>
  );
}
