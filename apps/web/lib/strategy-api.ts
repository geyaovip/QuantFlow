import {
  signalListResponseSchema,
  signalDetailResponseSchema,
  strategyDetailResponseSchema,
  strategyListResponseSchema,
  strategySubscriptionListResponseSchema,
  type SignalDetailResponse,
  type SignalListResponse,
  type StrategySubscriptionListResponse,
  type StrategyDetailResponse,
  type StrategyListResponse,
} from "@quantflow/contracts";
import { cookies } from "next/headers";

import { resolveApiBaseUrl } from "./auth-session";

type StrategyListQuery = {
  page?: number;
  pageSize?: number;
  riskLevel?: string;
};

type SignalListQuery = {
  page?: number;
  pageSize?: number;
  direction?: string;
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

async function getJson(path: string) {
  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`QuantFlow API request failed: ${response.status}`);
  }

  return response.json();
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("qf_user_session")?.value;
  return token ? `qf_user_session=${encodeURIComponent(token)}` : "";
}
