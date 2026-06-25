"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button, Card } from "@quantflow/ui";

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

type EmailOtpLoginProps = {
  apiBaseUrl: string;
  nextPath: string;
  siteKey?: string;
};

type Step = "email" | "code" | "success";

const disclaimer =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

async function postJson<TResponse>(
  apiBaseUrl: string,
  path: string,
  body: unknown,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("请求失败，请稍后重试。");
  }

  return (await response.json()) as TResponse;
}

export function EmailOtpLogin({
  apiBaseUrl,
  nextPath,
  siteKey,
}: EmailOtpLoginProps) {
  const widgetElementId = useId().replaceAll(":", "");
  const widgetIdRef = useRef<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!siteKey || widgetIdRef.current) {
      return;
    }

    const renderWidget = () => {
      const element = document.getElementById(widgetElementId);
      if (!element || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(element, {
        sitekey: siteKey,
        callback: setTurnstileToken,
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
  }, [siteKey, widgetElementId]);

  const resetTurnstile = () => {
    if (widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
    }
    setTurnstileToken("");
  };

  const requestCode = async () => {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await postJson<{ ok: true }>(
        apiBaseUrl,
        "/api/v1/auth/email-otp/request",
        {
          email,
          portal: "user",
          turnstileToken: turnstileToken || undefined,
        },
      );
      setStep("code");
      setMessage("验证码已发送。如果邮箱可用，请在 10 分钟内完成验证。");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "验证码发送失败，请稍后重试。",
      );
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await postJson(apiBaseUrl, "/api/v1/auth/email-otp/verify", {
        email,
        portal: "user",
        code,
      });
      setStep("success");
      setMessage("登录成功，正在进入应用。");
      window.location.assign(nextPath);
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
    <Card className="auth-card" aria-label="邮箱验证码登录">
      <div className="auth-card__header">
        <p>邮箱验证码登录</p>
        <h1>进入 QuantFlow 应用工作台</h1>
        <span>不需要密码。验证码和会话由 QuantFlow 后端安全管理。</span>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === "email") {
            void requestCode();
            return;
          }
          void verifyCode();
        }}
      >
        <label>
          邮箱
          <input
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            readOnly={step !== "email"}
            required
            type="email"
            value={email}
          />
        </label>

        {step === "email" && siteKey ? (
          <div className="turnstile-box" id={widgetElementId} />
        ) : null}

        {step !== "email" ? (
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

        {message ? <p className="auth-message">{message}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <Button disabled={isSubmitting || step === "success"} type="submit">
          {step === "email" ? "发送验证码" : "验证并进入应用"}
        </Button>
        {step === "code" ? (
          <button
            className="auth-link-button"
            disabled={isSubmitting}
            onClick={() => {
              setStep("email");
              setCode("");
              resetTurnstile();
            }}
            type="button"
          >
            更换邮箱或重新获取验证码
          </button>
        ) : null}
      </form>

      <p className="auth-risk">{disclaimer}</p>
    </Card>
  );
}
