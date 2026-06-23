import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@quantflow/ui/styles.css";
import "./styles.css";

export const metadata: Metadata = {
  title: { default: "管理后台｜QuantFlow", template: "%s｜QuantFlow 管理后台" },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
