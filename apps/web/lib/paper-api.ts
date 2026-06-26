import {
  paperAccountCreateSchema,
  paperAccountDetailResponseSchema,
  paperAccountListResponseSchema,
  paperExecuteSignalSchema,
  type PaperAccountCreate,
  type PaperAccountDetailResponse,
  type PaperAccountListResponse,
  type PaperExecuteSignal,
} from "@quantflow/contracts";

import { getJson, postJson } from "./strategy-api";
import { resolveApiBaseUrl } from "./auth-session";

export async function getPaperAccounts(
  page = 1,
  pageSize = 20,
): Promise<PaperAccountListResponse> {
  const payload = await getJson(
    `/api/v1/paper-accounts?page=${page}&pageSize=${pageSize}`,
  );
  return paperAccountListResponseSchema.parse(payload);
}

export async function getPaperAccount(
  accountId: string,
): Promise<PaperAccountDetailResponse> {
  const payload = await getJson(`/api/v1/paper-accounts/${accountId}`);
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function createPaperAccount(input: PaperAccountCreate) {
  paperAccountCreateSchema.parse(input);
  const payload = await postJson("/api/v1/paper-accounts", input);
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function executePaperSignal(
  accountId: string,
  input: PaperExecuteSignal,
) {
  paperExecuteSignalSchema.parse(input);
  const payload = await postJson(
    `/api/v1/paper-accounts/${accountId}/execute-signal`,
    input,
  );
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function pausePaperAccount(accountId: string) {
  const payload = await postJson(
    `/api/v1/paper-accounts/${accountId}/pause`,
    {},
  );
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function resumePaperAccount(accountId: string) {
  const payload = await postJson(
    `/api/v1/paper-accounts/${accountId}/resume`,
    {},
  );
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function endPaperAccount(accountId: string) {
  const payload = await postJson(`/api/v1/paper-accounts/${accountId}/end`, {});
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function copyPaperAccount(accountId: string) {
  const payload = await postJson(`/api/v1/paper-accounts/${accountId}/copies`, {
    riskDisclosureVersion: "risk-v1",
    riskAccepted: true,
  });
  return paperAccountDetailResponseSchema.parse(payload);
}

export async function deletePaperAccount(accountId: string) {
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/v1/paper-accounts/${accountId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error("删除模拟盘失败");
  }
}
