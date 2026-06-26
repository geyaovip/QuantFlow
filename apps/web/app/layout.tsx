import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@quantflow/ui/styles.css";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quantflow.chat"),
  title: {
    default: "QuantFlow｜策略研究与模拟验证",
    template: "%s｜QuantFlow",
  },
  description:
    "QuantFlow 面向加密资产策略研究与模拟验证，收益、回撤、样本量、风险事件和模拟盘表现始终并列展示。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "QuantFlow｜策略研究与模拟验证",
    description:
      "专业、克制的加密资产策略研究平台。收益指标与风险指标始终并列展示，不连接交易所，不托管真实资产。",
    url: "https://quantflow.chat",
    siteName: "QuantFlow",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "QuantFlow｜策略研究与模拟验证",
    description:
      "策略信号、风险指标与模拟盘表现并列展示。不连接交易所，不托管资产，不提供投资建议。",
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
