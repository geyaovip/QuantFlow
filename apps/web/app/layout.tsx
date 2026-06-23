import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@quantflow/ui/styles.css";
import "./styles.css";

export const metadata: Metadata = {
  title: {
    default: "QuantFlow｜策略信号与模拟盘",
    template: "%s｜QuantFlow",
  },
  description: "面向中国用户的加密货币策略信号与模拟盘平台。",
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
