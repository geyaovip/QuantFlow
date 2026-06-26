"use client";

import * as Sentry from "@sentry/react";
import { useEffect } from "react";

type SentryClientInitProps = {
  dsn?: string;
};

export function SentryClientInit({ dsn }: SentryClientInitProps) {
  useEffect(() => {
    if (!dsn) {
      return;
    }

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
    });
  }, [dsn]);

  return null;
}
