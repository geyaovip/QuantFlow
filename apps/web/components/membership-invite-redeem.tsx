"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card } from "@quantflow/ui";

type MembershipInviteRedeemProps = {
  apiBaseUrl: string;
};

export function MembershipInviteRedeem({
  apiBaseUrl,
}: MembershipInviteRedeemProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!code.trim()) {
      setError("请输入邀请码");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/membership/redeem-invite`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code: code.trim(),
            riskDisclosureVersion: "risk-v1",
            riskAccepted: true,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "兑换失败，请检查邀请码后重试");
      }
      setMessage("邀请码兑换成功，会员权益已开通。");
      setCode("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "兑换失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="membership-invite-card">
      <h2>邀请码兑换</h2>
      <p>输入运营发放的邀请码可开通对应会员计划。邀请码只开通功能容量。</p>
      <label className="membership-field">
        <span>邀请码</span>
        <input
          autoComplete="off"
          disabled={isSubmitting}
          onChange={(event) => setCode(event.target.value)}
          placeholder="例如 QF-PRO-2026"
          value={code}
        />
      </label>
      <Button
        disabled={isSubmitting || !code.trim()}
        onClick={() => void submit()}
        type="button"
      >
        {isSubmitting ? "兑换中..." : "兑换邀请码"}
      </Button>
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </Card>
  );
}
