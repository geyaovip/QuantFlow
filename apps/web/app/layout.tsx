import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@quantflow/ui/styles.css";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quantflow.chat"),
  title: {
    default: "QuantFlow｜策略信号与模拟盘",
    template: "%s｜QuantFlow",
  },
  description:
    "QuantFlow 汇总策略信号、风险指标与模拟盘表现，帮助用户在不连接交易所、不触碰真实资产的前提下观察和验证策略。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "QuantFlow｜策略信号与模拟盘",
    description:
      "专业、克制的加密货币策略信号与模拟盘平台。收益指标与风险指标始终并列展示。",
    url: "https://quantflow.chat",
    siteName: "QuantFlow",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "QuantFlow｜策略信号与模拟盘",
    description:
      "策略信号、风险指标与模拟盘表现并列展示，不连接交易所，不提供投资建议。",
  },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
    apple: "/brand/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
