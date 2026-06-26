import { cookies } from "next/headers";

import {
  adminStrategyListResponseSchema,
  signalListResponseSchema,
  type AdminStrategyListResponse,
  type SignalListResponse,
} from "@quantflow/contracts";

export function resolveApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.quantflow.chat";
}

export async function getAdminStrategies(): Promise<AdminStrategyListResponse> {
  const payload = await getJson("/api/v1/admin/strategies?page=1&pageSize=50");
  return adminStrategyListResponseSchema.parse(payload);
}

export async function getAdminSignals(): Promise<SignalListResponse> {
  const payload = await getJson("/api/v1/admin/signals?page=1&pageSize=50");
  return signalListResponseSchema.parse(payload);
}

async function getJson(path: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("qf_admin_session")?.value;
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    headers: token
      ? { cookie: `qf_admin_session=${encodeURIComponent(token)}` }
      : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`QuantFlow admin API request failed: ${response.status}`);
  }

  return response.json();
}
