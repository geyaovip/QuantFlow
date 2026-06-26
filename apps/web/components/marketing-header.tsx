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
          <a href="#strategies">产品预览</a>
        </nav>
        <Link className="header-cta" href="/login?next=/app/strategies">
          进入应用
        </Link>
      </div>
    </header>
  );
}
