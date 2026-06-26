"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@quantflow/ui";

import { resolveApiBaseUrl } from "../lib/api-base-url";
import type { PaperAccountCreate } from "@quantflow/contracts";

const RISK_DISCLOSURE =
  "QuantFlow 不提供投资建议，不承诺任何收益。所有策略信号仅供参考，加密资产价格波动较大，用户需自行承担交易风险。历史表现不代表未来收益。";

type PaperAccountCreateFormProps = {
  defaults: Omit<PaperAccountCreate, "riskDisclosureVersion" | "riskAccepted">;
  redirectTo?: "detail" | "list";
  submitLabel?: string;
};

export function PaperAccountCreateForm({
  defaults,
  redirectTo = "detail",
  submitLabel = "创建模拟盘",
}: PaperAccountCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaults.name);
  const [initialBalance, setInitialBalance] = useState(defaults.initialBalance);
  const [maxPositionPct, setMaxPositionPct] = useState(defaults.maxPositionPct);
  const [maxPositions, setMaxPositions] = useState(
    String(defaults.maxPositions),
  );
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!riskAccepted) {
      setError("请先确认风险提示。");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${resolveApiBaseUrl()}/api/v1/paper-accounts`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...defaults,
            name,
            initialBalance,
            maxPositionPct,
            maxPositions: Number(maxPositions),
            riskDisclosureVersion: "risk-v1",
            riskAccepted: true,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        data?: { id: string };
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "创建模拟盘失败");
      }

      if (redirectTo === "detail" && payload?.data?.id) {
        router.push(`/app/paper-trading/${payload.data.id}`);
        router.refresh();
        return;
      }

      router.push("/app/paper-trading");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "创建模拟盘失败",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="paper-create-form">
      <p className="paper-create-form__note">
        以下均为模拟对象，不连接交易所，不产生真实订单或资产变动。止损止盈规则跟随策略信号字段执行。
      </p>
      <label className="paper-create-form__field">
        <span>模拟盘名称</span>
        <input
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>
      <label className="paper-create-form__field">
        <span>初始资金（USDT，模拟）</span>
        <input
          onChange={(event) => setInitialBalance(event.target.value)}
          value={initialBalance}
        />
      </label>
      <label className="paper-create-form__field">
        <span>单笔最大仓位比例（0-1）</span>
        <input
          onChange={(event) => setMaxPositionPct(event.target.value)}
          value={maxPositionPct}
        />
      </label>
      <label className="paper-create-form__field">
        <span>最大持仓数量</span>
        <input
          max={10}
          min={1}
          onChange={(event) => setMaxPositions(event.target.value)}
          type="number"
          value={maxPositions}
        />
      </label>
      <label className="membership-risk-check">
        <input
          checked={riskAccepted}
          onChange={(event) => setRiskAccepted(event.target.checked)}
          type="checkbox"
        />
        <span>{RISK_DISCLOSURE}</span>
      </label>
      <Button
        disabled={isSubmitting}
        onClick={() => void submit()}
        type="button"
      >
        {isSubmitting ? "创建中..." : submitLabel}
      </Button>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
