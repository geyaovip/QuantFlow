import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  ChartSpline,
  CircleDollarSign,
  Layers3,
  LineChart,
  Radio,
  ShieldCheck,
  WalletCards,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { Badge, Card, RiskBadge } from "@quantflow/ui";

import { MarketingFooter } from "../components/marketing-footer";
import { MarketingHeader } from "../components/marketing-header";
import { getStrategies } from "../lib/strategy-api";
import {
  formatPercent,
  formatRiskLevel,
  formatSignalDirection,
} from "../lib/strategy-format";

const fallbackPreview = [
  {
    name: "BTC 趋势过滤",
    returnRate: "+12.8%",
    drawdown: "-6.4%",
    risk: "中" as const,
    trades: "67",
  },
  {
    name: "ETH 波动突破",
    returnRate: "+8.6%",
    drawdown: "-4.9%",
    risk: "中" as const,
    trades: "53",
  },
  {
    name: "SOL 均值观察",
    returnRate: "+5.1%",
    drawdown: "-3.2%",
    risk: "低" as const,
    trades: "41",
  },
];

const membershipPlans = [
  {
    name: "Free",
    price: "¥0",
    summary: "体验策略浏览与基础模拟容量。",
    perks: ["3 个策略订阅", "1 个模拟盘", "15 分钟信号延迟"],
  },
  {
    name: "Pro",
    price: "¥69/月",
    summary: "适合持续跟踪策略与信号。",
    perks: ["20 个策略订阅", "10 个模拟盘", "更快信号触达"],
    featured: true,
  },
  {
    name: "Premium",
    price: "¥199/月",
    summary: "更高配额与深度分析能力。",
    perks: ["50 个策略订阅", "30 个模拟盘", "优先客服支持"],
  },
] as const;

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const strategies = await getStrategies({ page: 1, pageSize: 3 }).catch(
    () => null,
  );
  const featuredStrategy = strategies?.data[0];
  const previewRows = strategies?.data.length
    ? strategies.data.map((strategy) => ({
        name: strategy.name,
        returnRate: formatPercent(strategy.metric.returnRate, true),
        drawdown: formatPercent(strategy.metric.maxDrawdown, false),
        risk: formatRiskLevel(strategy.riskLevel),
        trades: String(strategy.metric.tradeCount),
      }))
    : fallbackPreview;

  return (
    <>
      <MarketingHeader />
      <main>
        <section className="hero">
          <div className="hero__copy">
            <Badge tone="info">策略信号 · 模拟验证</Badge>
            <h1>
              更冷静地
              <br />
              看策略
            </h1>
            <p>
              QuantFlow
              把策略信号、风险指标和模拟表现放在同一工作台里。先看懂风险，再决定是否跟踪或模拟验证。
            </p>
            <div className="hero__actions">
              <Link className="primary-link" href="/login?next=/app/strategies">
                进入应用 <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <a className="secondary-link" href="#workflow">
                了解使用流程
              </a>
            </div>
            <div className="hero__trust" aria-label="平台边界">
              <span>非投资建议</span>
              <span>收益风险并列</span>
              <span>仅模拟交易</span>
            </div>
          </div>
          <Card className="hero-panel" aria-label="策略监控概览">
            <div className="hero-panel__header">
              <div>
                <span>
                  策略监控
                  {featuredStrategy ? " · 已入库策略" : " · 示例数据"}
                </span>
                <strong>
                  {featuredStrategy
                    ? `${featuredStrategy.name} · ${featuredStrategy.currentSignal ? formatSignalDirection(featuredStrategy.currentSignal.direction) : "暂无信号"}`
                    : "BTC 趋势过滤 · 观察中"}
                </strong>
              </div>
              <RiskBadge
                level={
                  featuredStrategy
                    ? formatRiskLevel(featuredStrategy.riskLevel)
                    : "中"
                }
              />
            </div>
            <div className="hero-snapshot" aria-label="策略关键指标">
              <div>
                <span>近 90 天收益</span>
                <strong className="positive">
                  {featuredStrategy
                    ? formatPercent(featuredStrategy.metric.returnRate, true)
                    : "+12.8%"}
                </strong>
              </div>
              <div>
                <span>最大回撤</span>
                <strong>
                  {featuredStrategy
                    ? formatPercent(featuredStrategy.metric.maxDrawdown, false)
                    : "-6.4%"}
                </strong>
              </div>
              <div>
                <span>胜率 / 样本</span>
                <strong>
                  {featuredStrategy
                    ? `${formatPercent(featuredStrategy.metric.winRate, false)} / ${featuredStrategy.metric.tradeCount}`
                    : "58.2% / 67"}
                </strong>
              </div>
              <div>
                <span>盈亏比</span>
                <strong>
                  {featuredStrategy
                    ? Number(featuredStrategy.metric.profitLossRatio).toFixed(2)
                    : "1.46"}
                </strong>
              </div>
            </div>
            <p className="hero-panel__note">
              {featuredStrategy
                ? "数据来自当前已发布策略，历史表现不代表未来收益。"
                : "示例数据仅供展示界面结构，不代表真实或未来表现。"}
            </p>
          </Card>
        </section>

        <section className="section-block positioning-block" id="positioning">
          <div className="section-heading section-heading--center">
            <h2>不是代客交易，而是帮你做策略判断</h2>
            <p>
              QuantFlow
              聚焦策略理解、信号跟踪和模拟验证，不提供交易所连接，也不执行真实下单。
            </p>
          </div>
          <div className="positioning-grid">
            {[
              [
                ChartNoAxesCombined,
                "先看策略，再看信号",
                "从策略逻辑、历史表现和风险特征出发，再决定是否跟踪信号。",
              ],
              [
                ShieldCheck,
                "收益与风险并列",
                "任何收益展示都同屏附带回撤、样本和盈亏比，避免只看涨幅。",
              ],
              [
                WalletCards,
                "用模拟盘验证想法",
                "在模拟环境中观察策略过程，所有余额与成交均标注为模拟。",
              ],
            ].map(([Icon, title, copy]) => {
              const PositionIcon = Icon as typeof ChartNoAxesCombined;
              return (
                <Card className="positioning-card" key={String(title)}>
                  <span className="feature-card__icon">
                    <PositionIcon aria-hidden="true" />
                  </span>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="section-block" id="features">
          <div className="section-heading">
            <h2>一个工作台，覆盖策略研究链路</h2>
            <p>
              从发现策略到跟踪信号，再到模拟验证，减少在多个工具之间来回切换。
            </p>
          </div>
          <div className="capabilities-grid">
            {[
              [ChartSpline, "策略广场", "按市场、风险等级和表现筛选策略。"],
              [Radio, "信号中心", "集中查看触发记录、有效期和失效条件。"],
              [WalletCards, "模拟盘", "创建模拟账户，跟踪持仓、订单和回撤。"],
              [BellRing, "通知提醒", "站内通知与邮件提醒，帮助你及时回看。"],
              [LineChart, "表现分析", "查看收益曲线，并同步观察最大回撤。"],
              [Layers3, "会员权益", "按订阅等级开放策略、模拟盘和历史容量。"],
            ].map(([Icon, title, copy]) => {
              const CapabilityIcon = Icon as typeof ChartSpline;
              return (
                <Card className="capability-card" key={String(title)}>
                  <span className="feature-card__icon">
                    <CapabilityIcon aria-hidden="true" />
                  </span>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="section-block product-preview" id="signals">
          <div className="section-heading">
            <h2>策略信号，带来源与风险上下文</h2>
            <p>
              信号不是单独一条买卖提示，而是附带策略、风险等级、样本规模和失效条件的可解释记录。
            </p>
          </div>
          <div className="product-preview__grid">
            <div className="feature-list" aria-label="信号能力说明">
              {[
                ["触发价格与当前快照并列展示，避免脱离市场语境。"],
                ["每条信号标注有效期，过期后不再作为有效参考。"],
                ["高风险策略要求额外确认，减少误读。"],
              ].map(([copy]) => (
                <Card className="feature-card feature-card--compact" key={copy}>
                  <p>{copy}</p>
                </Card>
              ))}
            </div>
            <div className="preview-table" role="table" aria-label="策略示例">
              <div className="preview-row preview-row--header" role="row">
                <span>策略</span>
                <span>近 90 天收益</span>
                <span>最大回撤</span>
                <span>风险</span>
                <span>样本</span>
              </div>
              {previewRows.map((row) => (
                <div
                  className="preview-row preview-row--5"
                  role="row"
                  key={row.name}
                >
                  <strong>{row.name}</strong>
                  <span className="positive">{row.returnRate}</span>
                  <span>{row.drawdown}</span>
                  <RiskBadge level={row.risk} />
                  <span>{row.trades} 笔</span>
                </div>
              ))}
            </div>
          </div>
          <p className="section-note">
            {featuredStrategy
              ? "上表展示当前已入库策略样本。登录应用后可查看完整策略列表与指标口径说明。"
              : "上表为官网示例数据。登录应用后可查看完整策略列表与指标口径说明。"}
          </p>
        </section>

        <section className="section-block section-block--muted" id="paper">
          <div className="section-heading">
            <h2>模拟盘：在投入真实资金前先观察过程</h2>
            <p>
              所有模拟余额、持仓、订单和成交均明确标注“模拟”，与真实账户完全隔离。
            </p>
          </div>
          <div className="paper-grid">
            <Card className="paper-card">
              <span className="paper-card__label">模拟账户</span>
              <strong>初始资金 ¥10,000</strong>
              <p>按策略信号在模拟环境中跟踪仓位变化，不涉及真实资产。</p>
            </Card>
            <Card className="paper-card">
              <span className="paper-card__label">风险联动</span>
              <strong>回撤与连亏监控</strong>
              <p>当模拟账户触发风险阈值时，系统会提示暂停或复核策略状态。</p>
            </Card>
            <Card className="paper-card">
              <span className="paper-card__label">行情依赖</span>
              <strong>快照撮合 · 非实时成交价</strong>
              <p>模拟成交基于有效行情快照，不承诺与交易所实时盘口一致。</p>
            </Card>
          </div>
        </section>

        <section className="section-block" id="risk">
          <div className="risk-panel">
            <div>
              <Badge tone="warning">风控优先</Badge>
              <h2>把风险放在收益前面</h2>
              <p>
                QuantFlow
                不承诺收益，也不提供保本或稳赚表述。平台默认要求关键页面同时展示收益、回撤、样本和盈亏比。
              </p>
              <ul className="risk-list">
                <li>策略详情、信号详情和模拟盘创建前必须完成风险披露确认。</li>
                <li>行情延迟或数据异常时，相关模拟盘可自动暂停新成交。</li>
                <li>不提供交易所 API 连接、半自动或全自动交易入口。</li>
              </ul>
            </div>
            <Card className="risk-metrics-card" aria-label="风险指标示例">
              <div>
                <span>同周期最大回撤</span>
                <strong>-6.4%</strong>
              </div>
              <div>
                <span>交易样本</span>
                <strong>67 笔</strong>
              </div>
              <div>
                <span>盈亏比</span>
                <strong>1.46</strong>
              </div>
              <div>
                <span>风险等级</span>
                <RiskBadge level="中" />
              </div>
            </Card>
          </div>
        </section>

        <section className="section-block section-block--muted" id="workflow">
          <div className="section-heading section-heading--center">
            <h2>四步开始使用</h2>
            <p>从官网进入应用后，按这条路径完成第一次策略观察。</p>
          </div>
          <ol className="workflow-steps">
            {[
              ["登录应用", "使用邮箱验证码登录，无需绑定交易所。"],
              ["浏览策略广场", "按风险、市场和表现筛选策略，查看回撤与样本。"],
              ["跟踪信号", "在信号中心查看触发记录、有效期和风险说明。"],
              ["创建模拟盘", "用模拟资金验证策略过程，所有对象均标注模拟。"],
            ].map(([title, copy], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="workflow-cta">
            <Workflow aria-hidden="true" size={18} />
            <Link className="primary-link" href="/login?next=/app/strategies">
              现在进入应用
            </Link>
          </div>
        </section>

        <section className="section-block" id="pricing">
          <div className="section-heading">
            <h2>会员权益按容量开放，不售卖预期收益</h2>
            <p>
              会员只决定你能订阅多少策略、创建多少模拟盘，以及信号和历史数据的访问容量。当前暂未开放在线购买。
            </p>
          </div>
          <div className="pricing-grid">
            {membershipPlans.map((plan) => (
              <Card
                className={
                  "featured" in plan && plan.featured
                    ? "pricing-card pricing-card--featured"
                    : "pricing-card"
                }
                key={plan.name}
              >
                <div className="pricing-card__header">
                  <span>{plan.name}</span>
                  <strong>{plan.price}</strong>
                </div>
                <p>{plan.summary}</p>
                <ul>
                  {plan.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <p className="section-note">
            价格为内测参考价，不构成收费承诺。Pro / Premium
            目前通过邀请或人工开通。
          </p>
        </section>

        <section
          className="section-block risk-disclosure-block"
          id="risk-disclosure"
        >
          <Card className="risk-disclosure-card">
            <CircleDollarSign aria-hidden="true" size={20} />
            <div>
              <h2>风险提示</h2>
              <p>
                QuantFlow
                不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。
              </p>
            </div>
          </Card>
        </section>

        <section className="landing-cta" aria-label="进入应用">
          <div>
            <h2>准备好查看你的策略工作台了吗？</h2>
            <p>
              登录后即可浏览策略广场、信号中心和模拟盘。所有模拟对象均明确标注。
            </p>
          </div>
          <Link className="primary-link" href="/login?next=/app/strategies">
            进入应用 <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
