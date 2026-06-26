import {
  securityEventListResponseSchema,
  signalListResponseSchema,
  signalDetailResponseSchema,
  strategyDetailResponseSchema,
  strategyListResponseSchema,
  strategySubscriptionListResponseSchema,
  type SecurityEventListResponse,
  type SignalDetailResponse,
  type SignalListResponse,
  type StrategySubscriptionListResponse,
  type StrategyDetailResponse,
  type StrategyListResponse,
} from "@quantflow/contracts";
import { cookies } from "next/headers";

import { resolveApiBaseUrl } from "./api-base-url";
import { ApiError } from "./api-error";

type StrategyListQuery = {
  page?: number;
  pageSize?: number;
  riskLevel?: string;
  type?: string;
  symbol?: string;
  sortBy?: string;
  sortOrder?: string;
};

type SignalListQuery = {
  page?: number;
  pageSize?: number;
  direction?: string;
  status?: string;
};

export async function getStrategies(
  query: StrategyListQuery = {},
): Promise<StrategyListResponse> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 20),
  });
  if (query.riskLevel) {
    params.set("riskLevel", query.riskLevel);
  }
  if (query.type) {
    params.set("type", query.type);
  }
  if (query.symbol) {
    params.set("symbol", query.symbol);
  }
  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }
  if (query.sortOrder) {
    params.set("sortOrder", query.sortOrder);
  }
  const payload = await getJson(`/api/v1/strategies?${params.toString()}`);
  return strategyListResponseSchema.parse(payload);
}

export async function getStrategy(
  strategyId: string,
): Promise<StrategyDetailResponse> {
  const payload = await getJson(`/api/v1/strategies/${strategyId}`);
  return strategyDetailResponseSchema.parse(payload);
}

export async function getSignals(
  query: SignalListQuery = {},
): Promise<SignalListResponse> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 20),
  });
  if (query.direction) {
    params.set("direction", query.direction);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  const payload = await getJson(`/api/v1/signals?${params.toString()}`);
  return signalListResponseSchema.parse(payload);
}

export async function getSignal(
  signalId: string,
): Promise<SignalDetailResponse> {
  const payload = await getJson(`/api/v1/signals/${signalId}`);
  return signalDetailResponseSchema.parse(payload);
}

export async function getMyStrategies(): Promise<StrategySubscriptionListResponse> {
  const payload = await getJson(
    "/api/v1/me/strategy-subscriptions?page=1&pageSize=20",
  );
  return strategySubscriptionListResponseSchema.parse(payload);
}

export async function getSecurityEvents(
  page = 1,
): Promise<SecurityEventListResponse> {
  const payload = await getJson(
    `/api/v1/me/security-events?page=${page}&pageSize=20`,
  );
  return securityEventListResponseSchema.parse(payload);
}

export async function getJson(path: string) {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export async function postJson(path: string, body: unknown) {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return response.json();
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join("，");
    }
    if (payload.message) {
      return payload.message;
    }
  } catch {
    // ignore parse errors
  }

  return `QuantFlow API request failed: ${response.status}`;
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("qf_user_session")?.value;
  return token ? `qf_user_session=${encodeURIComponent(token)}` : "";
}
