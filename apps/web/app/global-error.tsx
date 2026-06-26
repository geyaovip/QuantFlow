"use client";

import * as Sentry from "@sentry/react";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <main
          style={{
            margin: "4rem auto",
            maxWidth: "32rem",
            padding: "0 1.5rem",
            fontFamily: "system-ui, sans-serif",
            color: "#111827",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            页面暂时无法加载
          </h1>
          <p
            style={{
              lineHeight: 1.6,
              color: "#4b5563",
              marginBottom: "1.5rem",
            }}
          >
            QuantFlow 遇到意外错误。请稍后重试；若问题持续，请联系支持团队。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#111827",
              border: "none",
              borderRadius: "0.5rem",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
              padding: "0.625rem 1rem",
            }}
          >
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
