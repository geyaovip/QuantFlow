import {
  adminAuditLogListResponseSchema,
  type AdminAuditLogListResponse,
} from "@quantflow/contracts";
import { cookies } from "next/headers";

import { resolveApiBaseUrl } from "./strategy-api";

export async function getAdminAuditLogs(
  page = 1,
  pageSize = 50,
): Promise<AdminAuditLogListResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("qf_admin_session")?.value;
  const response = await fetch(
    `${resolveApiBaseUrl()}/api/v1/admin/audit-logs?page=${page}&pageSize=${pageSize}`,
    {
      headers: token
        ? { cookie: `qf_admin_session=${encodeURIComponent(token)}` }
        : undefined,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`QuantFlow admin API request failed: ${response.status}`);
  }

  const payload = await response.json();
  return adminAuditLogListResponseSchema.parse(payload);
}
