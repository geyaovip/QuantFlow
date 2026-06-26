import {
  ArrowRight,
  ChartSpline,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { Badge, Card, RiskBadge } from "@quantflow/ui";

import { MarketingHeader } from "../components/marketing-header";

const disclaimer = "不提供投资建议。历史表现不代表未来收益。";

export default function MarketingPage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <section className="hero">
          <div className="hero__copy">
            <Badge tone="info">Strategy intelligence</Badge>
            <h1>
              更冷静地
              <br />
              看策略
            </h1>
            <p>QuantFlow 将策略信号、风险指标和模拟表现放在同一个工作台里。</p>
            <div className="hero__actions">
              <Link className="primary-link" href="/login?next=/app/strategies">
                进入应用 <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <a className="secondary-link" href="#strategies">
                查看策略库
              </a>
            </div>
            <div className="hero__trust" aria-label="平台边界">
              <span>策略信号</span>
              <span>风险指标</span>
              <span>模拟盘</span>
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
            <div className="hero-events" aria-label="监控记录">
              <p>监控记录</p>
              <ul>
                <li>
                  <span>10:42</span>
                  <strong>行情延迟恢复</strong>
                </li>
                <li>
                  <span>09:18</span>
                  <strong>ETH 策略进入观察</strong>
                </li>
                <li>
                  <span>昨天</span>
                  <strong>SOL 样本偏少</strong>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        <section id="features" className="section-block">
          <div className="section-heading">
            <p>能力</p>
            <h2>少一点噪音，多一点判断依据</h2>
          </div>
          <div className="feature-grid">
            {[
              [ChartSpline, "策略库", "按市场、风险和表现筛选策略。"],
              [WalletCards, "模拟盘", "用模拟资金跟踪策略过程。"],
              [ShieldCheck, "风险并列", "收益和回撤始终一起看。"],
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
            <p>策略库</p>
            <h2>表现和风险放在同一张表里</h2>
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

        <section className="landing-cta" aria-label="进入应用">
          <h2>开始查看策略工作台</h2>
          <Link className="primary-link" href="/login?next=/app/strategies">
            进入应用 <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>
      </main>
      <footer>
        <span>© 2026 QuantFlow</span>
        <span>{disclaimer}</span>
      </footer>
    </>
  );
}
