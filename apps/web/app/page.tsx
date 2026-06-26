import {
  ArrowRight,
  BellRing,
  ChartSpline,
  ListChecks,
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
            <Badge tone="info">策略研究 · 风险监控 · 模拟验证</Badge>
            <h1>
              把策略信号放进
              <br />
              可验证的数据流程。
            </h1>
            <p>
              QuantFlow
              面向加密资产策略研究与模拟验证。每个策略同时呈现收益、回撤、样本、风险事件和数据更新时间，帮助你在不连接交易所、不触碰真实资产的前提下建立观察流程。
            </p>
            <div className="hero__actions">
              <Link className="primary-link" href="/login?next=/app/strategies">
                进入应用 <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <a className="secondary-link" href="#workflow">
                查看使用流程
              </a>
            </div>
            <div className="hero__trust" aria-label="平台边界">
              <span>不连接交易所</span>
              <span>不托管资产</span>
              <span>不承诺收益</span>
            </div>
          </div>
          <Card className="hero-panel" aria-label="策略监控概览">
            <div className="hero-panel__header">
              <div>
                <span>策略监控</span>
                <strong>BTC 趋势过滤 · 观察中</strong>
              </div>
              <RiskBadge level="中" />
            </div>
            <div className="hero-snapshot" aria-label="策略关键指标">
              <div>
                <span>近 90 天收益</span>
                <strong className="positive">+12.8%</strong>
              </div>
              <div>
                <span>最大回撤</span>
                <strong>-6.4%</strong>
              </div>
              <div>
                <span>胜率 / 样本</span>
                <strong>58.2% / 67</strong>
              </div>
              <div>
                <span>数据更新时间</span>
                <strong>10:40 UTC+8</strong>
              </div>
            </div>
            <div className="hero-events" aria-label="最近事件">
              <p>最近事件</p>
              <ul>
                <li>
                  <span>10:42</span>
                  <strong>行情快照延迟已恢复</strong>
                </li>
                <li>
                  <span>09:18</span>
                  <strong>ETH 波动突破触发回撤观察</strong>
                </li>
                <li>
                  <span>昨天</span>
                  <strong>SOL 均值观察样本量低于阈值</strong>
                </li>
              </ul>
            </div>
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
                "策略库",
                "统一查看策略适用市场、样本数量、收益表现、最大回撤和风险等级。",
              ],
              [
                WalletCards,
                "模拟盘",
                "用模拟余额跟踪策略执行过程，订单、持仓和权益始终明确标记为模拟。",
              ],
              [
                ShieldCheck,
                "风险控制",
                "回撤、连续亏损、行情延迟和样本不足都会进入风险事件，不以收益遮盖风险。",
              ],
              [
                BellRing,
                "提醒与跟踪",
                "围绕策略、信号和模拟盘建立站内提醒，关键变化保留可追溯记录。",
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

        <section id="workflow" className="section-block workflow-block">
          <div className="section-heading">
            <p>使用流程</p>
            <h2>先筛选，再观察，最后只在模拟盘里验证。</h2>
          </div>
          <div className="workflow-grid">
            {[
              [
                "01",
                "筛选策略",
                "按市场、风险等级、样本量和访问权益筛选可观察策略。",
              ],
              [
                "02",
                "查看信号",
                "查看触发价格、失效条件、建议仓位和风险状态。",
              ],
              [
                "03",
                "模拟验证",
                "将策略加入模拟盘，跟踪权益、回撤、持仓和风险事件。",
              ],
            ].map(([step, title, copy]) => (
              <Card className="workflow-card" key={step}>
                <span>{step}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="strategies" className="section-block strategy-preview">
          <div className="section-heading">
            <p>策略库</p>
            <h2>收益指标旁边，永远放着同周期风险指标。</h2>
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
          <div className="preview-note">
            <ListChecks aria-hidden="true" size={18} />
            <span>
              策略详情页会展示数据来源、更新时间、样本量、适用/不适用行情和风险事件。收益表现不能单独作为使用依据。
            </span>
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
            <p>访问权益</p>
            <h2>访问范围、提醒和模拟容量可分级；收益预期不作为权益。</h2>
          </div>
          <div className="membership-grid">
            {[
              ["基础访问", "查看公开策略、风险披露和基础模拟结果。"],
              ["研究访问", "解锁更多策略、信号提醒和模拟盘容量。"],
              ["运营开通", "第一版由管理员审核开通，不在官网承诺在线购买。"],
            ].map(([title, copy]) => (
              <Card className="membership-card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </Card>
            ))}
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
