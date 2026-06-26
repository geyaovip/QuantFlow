import Link from "next/link";

const riskDisclosure =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer__grid">
        <div>
          <strong>QuantFlow</strong>
          <p>
            策略信号与模拟验证平台。帮助你看懂策略表现与风险，不提供实盘交易。
          </p>
        </div>
        <div>
          <span>产品</span>
          <a href="#features">产品能力</a>
          <a href="#signals">策略信号</a>
          <a href="#paper">模拟盘</a>
        </div>
        <div>
          <span>了解</span>
          <a href="#risk">风控理念</a>
          <a href="#workflow">使用流程</a>
          <a href="#pricing">会员权益</a>
        </div>
        <div>
          <span>开始</span>
          <Link href="/login?next=/app/strategies">进入应用</Link>
        </div>
      </div>
      <div className="marketing-footer__meta">
        <span>© 2026 QuantFlow</span>
        <span>{riskDisclosure}</span>
      </div>
    </footer>
  );
}
