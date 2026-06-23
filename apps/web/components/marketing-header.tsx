import Link from "next/link";

import { Brand } from "./brand";

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <div className="marketing-header__inner">
        <Link href="/" aria-label="QuantFlow 首页">
          <Brand />
        </Link>
        <nav aria-label="官网导航">
          <a href="#features">产品能力</a>
          <a href="#strategies">策略示例</a>
          <a href="#risk">风险原则</a>
          <a href="#membership">会员权益</a>
        </nav>
        <Link className="header-cta" href="/app/strategies">
          进入应用
        </Link>
      </div>
    </header>
  );
}
