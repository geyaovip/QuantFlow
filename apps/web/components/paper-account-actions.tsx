"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@quantflow/ui";

import { resolveApiBaseUrl } from "../lib/api-base-url";

type PaperAccountActionsProps = {
  accountId: string;
  status: "running" | "paused" | "ended" | "data_error" | "strategy_paused";
};

export function PaperAccountActions({
  accountId,
  status,
}: PaperAccountActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const mutate = async (
    action: "pause" | "resume" | "end" | "copies" | "reset",
    options?: { method?: string; body?: unknown },
  ) => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${resolveApiBaseUrl()}/api/v1/paper-accounts/${accountId}/${action}`,
        {
          method: options?.method ?? "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            options?.body ??
              (action === "copies" || action === "reset"
                ? {
                    riskDisclosureVersion: "risk-v1",
                    riskAccepted: true,
                  }
                : {}),
          ),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        data?: { id: string };
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "操作失败");
      }

      if (action === "pause") {
        setMessage("模拟盘已暂停。");
      } else if (action === "resume") {
        setMessage("模拟盘已恢复运行。");
      } else if (action === "end") {
        setMessage("模拟盘已结束。");
        setConfirmEnd(false);
      } else if (action === "reset") {
        setMessage("模拟盘已重置。");
        setConfirmReset(false);
      } else if (action === "copies" && payload?.data?.id) {
        router.push(`/app/paper-trading/${payload.data.id}`);
        return;
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAccount = async () => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${resolveApiBaseUrl()}/api/v1/paper-accounts/${accountId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "删除失败");
      }

      router.push("/app/paper-trading");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "删除失败");
    } finally {
      setIsSubmitting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="paper-account-actions">
      {status === "running" ? (
        <Button
          disabled={isSubmitting}
          onClick={() => void mutate("pause")}
          type="button"
          variant="secondary"
        >
          暂停模拟盘
        </Button>
      ) : null}
      {status === "paused" ? (
        <>
          <Button
            disabled={isSubmitting}
            onClick={() => void mutate("resume")}
            type="button"
          >
            恢复运行
          </Button>
          {confirmReset ? (
            <>
              <Button
                disabled={isSubmitting}
                onClick={() => void mutate("reset")}
                type="button"
              >
                确认重置
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => setConfirmReset(false)}
                type="button"
                variant="secondary"
              >
                取消
              </Button>
            </>
          ) : (
            <Button
              disabled={isSubmitting}
              onClick={() => setConfirmReset(true)}
              type="button"
              variant="secondary"
            >
              重置模拟盘
            </Button>
          )}
        </>
      ) : null}
      {status === "strategy_paused" ? (
        <Button
          disabled={isSubmitting}
          onClick={() => void mutate("resume")}
          type="button"
        >
          尝试恢复运行
        </Button>
      ) : null}
      {status === "running" || status === "paused" ? (
        confirmEnd ? (
          <>
            <Button
              disabled={isSubmitting}
              onClick={() => void mutate("end")}
              type="button"
            >
              确认结束
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => setConfirmEnd(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
          </>
        ) : (
          <Button
            disabled={isSubmitting}
            onClick={() => setConfirmEnd(true)}
            type="button"
            variant="secondary"
          >
            结束模拟盘
          </Button>
        )
      ) : null}
      {status !== "ended" ? (
        <Button
          disabled={isSubmitting}
          onClick={() => void mutate("copies")}
          type="button"
          variant="secondary"
        >
          复制配置
        </Button>
      ) : null}
      {status === "paused" || status === "ended" ? (
        confirmDelete ? (
          <>
            <Button
              disabled={isSubmitting}
              onClick={() => void deleteAccount()}
              type="button"
            >
              确认删除
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => setConfirmDelete(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
          </>
        ) : (
          <Button
            disabled={isSubmitting}
            onClick={() => setConfirmDelete(true)}
            type="button"
            variant="secondary"
          >
            删除模拟盘
          </Button>
        )
      ) : null}
      {message ? <p className="auth-message">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
