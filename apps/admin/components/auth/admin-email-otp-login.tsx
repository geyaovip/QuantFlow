"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button, Card } from "@quantflow/ui";

import {
  getOtpResendSecondsLeft,
  useOtpResendCooldown,
} from "../../lib/otp-resend-cooldown";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type AdminEmailOtpLoginProps = {
  apiBaseUrl: string;
  siteKey?: string;
};

async function postJson(
  apiBaseUrl: string,
  path: string,
  body: unknown,
): Promise<{ data: { message: string; resendAvailableAt?: string } }> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("请求失败，请稍后重试。");
  }

  return (await response.json()) as {
    data: { message: string; resendAvailableAt?: string };
  };
}

export function AdminEmailOtpLogin({
  apiBaseUrl,
  siteKey,
}: AdminEmailOtpLoginProps) {
  const widgetElementId = useId().replaceAll(":", "");
  const widgetIdRef = useRef<string | null>(null);
  const awaitingTurnstileRef = useRef(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [hasRequestedCode, setHasRequestedCode] = useState(false);
  const [hasEverSent, setHasEverSent] = useState(false);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(
    null,
  );
  const resendSecondsLeft = useOtpResendCooldown(resendAvailableAt);

  const resetTurnstile = () => {
    if (widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
    }
    setTurnstileToken("");
    setShowTurnstile(false);
    awaitingTurnstileRef.current = false;
  };

  const requestCode = async (tokenOverride?: string) => {
    if (resendSecondsLeft > 0 && hasEverSent && !hasRequestedCode) {
      setError("");
      setMessage(`验证码发送过于频繁，请 ${resendSecondsLeft} 秒后再试。`);
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await postJson(
        apiBaseUrl,
        "/api/v1/auth/email-otp/request",
        {
          email,
          portal: "admin",
          turnstileToken: (tokenOverride ?? turnstileToken) || undefined,
        },
      );
      const nextResendAt = result.data.resendAvailableAt ?? null;
      setResendAvailableAt(nextResendAt);
      const secondsLeft = getOtpResendSecondsLeft(nextResendAt);

      if (secondsLeft > 0 && hasEverSent && !hasRequestedCode) {
        setMessage(`验证码发送过于频繁，请 ${secondsLeft} 秒后再试。`);
        resetTurnstile();
        return;
      }

      setHasEverSent(true);
      setHasRequestedCode(true);
      setMessage("验证码已发送，请查看邮箱。短时间内请勿重复请求。");
      resetTurnstile();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "验证码发送失败，请稍后重试。",
      );
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
      awaitingTurnstileRef.current = false;
    }
  };

  const handleTurnstileToken = (token: string) => {
    setTurnstileToken(token);
    if (awaitingTurnstileRef.current) {
      void requestCode(token);
    }
  };

  useEffect(() => {
    if (!siteKey || !showTurnstile || widgetIdRef.current) {
      return;
    }

    const renderWidget = () => {
      const element = document.getElementById(widgetElementId);
      if (!element || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(element, {
        sitekey: siteKey,
        callback: handleTurnstileToken,
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [siteKey, showTurnstile, widgetElementId]);

  const beginRequestCode = () => {
    if (resendSecondsLeft > 0 && hasEverSent && !hasRequestedCode) {
      setError("");
      setMessage(`验证码发送过于频繁，请 ${resendSecondsLeft} 秒后再试。`);
      return;
    }

    if (siteKey && !turnstileToken) {
      setError("");
      awaitingTurnstileRef.current = true;
      setShowTurnstile(true);
      return;
    }

    void requestCode();
  };

  const verifyCode = async () => {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await postJson(apiBaseUrl, "/api/v1/auth/email-otp/verify", {
        email,
        portal: "admin",
        code,
      });
      setMessage("登录成功，正在进入管理后台。");
      window.location.assign("/admin");
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "验证码校验失败，请重新输入。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="admin-login-card" aria-label="管理后台邮箱验证码登录">
      <div className="admin-login-card__header">
        <p>管理后台</p>
        <h1>管理员登录</h1>
        <span>输入管理员邮箱，获取一次性验证码。</span>
      </div>

      <form
        className="admin-login-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!hasRequestedCode) {
            beginRequestCode();
            return;
          }
          void verifyCode();
        }}
      >
        <label>
          管理员邮箱
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setResendAvailableAt(null);
            }}
            placeholder="admin@example.com"
            readOnly={hasRequestedCode}
            required
            type="email"
            value={email}
          />
        </label>

        {!hasRequestedCode && showTurnstile && siteKey ? (
          <div className="turnstile-box" id={widgetElementId} />
        ) : null}

        {hasRequestedCode ? (
          <label>
            6 位验证码
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              name="code"
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              pattern="[0-9]{6}"
              placeholder="000000"
              required
              type="text"
              value={code}
            />
          </label>
        ) : null}

        {message ? <p className="admin-login-message">{message}</p> : null}
        {error ? <p className="admin-login-error">{error}</p> : null}

        <Button
          disabled={
            isSubmitting ||
            (!hasRequestedCode &&
              (resendSecondsLeft > 0 || (showTurnstile && !turnstileToken)))
          }
          type="submit"
        >
          {!hasRequestedCode && resendSecondsLeft > 0 && hasEverSent
            ? `${resendSecondsLeft} 秒后可重发`
            : hasRequestedCode
              ? "验证并进入后台"
              : "发送验证码"}
        </Button>
        {hasRequestedCode ? (
          <button
            className="admin-login-link"
            disabled={isSubmitting}
            onClick={() => {
              setHasRequestedCode(false);
              setCode("");
              resetTurnstile();
            }}
            type="button"
          >
            更换邮箱或重新获取验证码
          </button>
        ) : null}
      </form>
    </Card>
  );
}
