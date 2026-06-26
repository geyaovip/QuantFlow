import { cookies } from "next/headers";

import {
  adminPaperAccountListResponseSchema,
  type AdminPaperAccountListResponse,
} from "@quantflow/contracts";

import { resolveApiBaseUrl } from "./strategy-api";

export async function getAdminPaperAccounts(): Promise<AdminPaperAccountListResponse> {
  const payload = await getJson(
    "/api/v1/admin/paper-accounts?page=1&pageSize=50",
  );
  return adminPaperAccountListResponseSchema.parse(payload);
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
