"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Brand } from "./brand";

const navItems = [
  { href: "#features", label: "产品能力" },
  { href: "#signals", label: "策略信号" },
  { href: "#paper", label: "模拟盘" },
  { href: "#risk", label: "风控理念" },
  { href: "#pricing", label: "会员权益" },
] as const;

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="marketing-header">
      <div className="marketing-header__inner">
        <Link href="/" aria-label="QuantFlow 首页">
          <Brand />
        </Link>
        <nav aria-label="官网导航">
          {navItems.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="marketing-header__actions">
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            className="marketing-header__menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? (
              <X aria-hidden="true" size={20} />
            ) : (
              <Menu aria-hidden="true" size={20} />
            )}
          </button>
          <Link className="header-cta" href="/login?next=/app/strategies">
            进入应用
          </Link>
        </div>
      </div>
      {menuOpen ? (
        <nav
          aria-label="官网移动端导航"
          className="marketing-mobile-nav"
          onClick={() => setMenuOpen(false)}
        >
          {navItems.map(({ href, label }) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
          <Link className="primary-link" href="/login?next=/app/strategies">
            进入应用
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
