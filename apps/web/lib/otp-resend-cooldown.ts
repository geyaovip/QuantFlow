import { useEffect, useState } from "react";

export function getOtpResendSecondsLeft(
  resendAvailableAt: string | null,
  nowMs = Date.now(),
) {
  if (!resendAvailableAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((new Date(resendAvailableAt).getTime() - nowMs) / 1000),
  );
}

export function useOtpResendCooldown(resendAvailableAt: string | null) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!resendAvailableAt) {
      return;
    }

    const secondsLeft = getOtpResendSecondsLeft(resendAvailableAt, Date.now());
    if (secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendAvailableAt]);

  return getOtpResendSecondsLeft(resendAvailableAt, nowMs);
}
