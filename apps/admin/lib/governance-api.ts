import { cookies } from "next/headers";

import {
  adminAccountListResponseSchema,
  adminAnnouncementListResponseSchema,
  adminDashboardSummaryResponseSchema,
  adminMembershipInviteListResponseSchema,
  adminRiskEventListResponseSchema,
  adminRoleListResponseSchema,
  adminSubscriptionListResponseSchema,
  adminUserListResponseSchema,
  type AdminAccountListResponse,
  type AdminAnnouncementListResponse,
  type AdminDashboardSummaryResponse,
  type AdminRiskEventListResponse,
  type AdminRoleListResponse,
  type AdminSubscriptionListResponse,
  type AdminUserListResponse,
} from "@quantflow/contracts";

import { resolveApiBaseUrl } from "./strategy-api";

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

export async function getAdminDashboard(): Promise<AdminDashboardSummaryResponse> {
  return adminDashboardSummaryResponseSchema.parse(
    await getJson("/api/v1/admin/dashboard"),
  );
}

export async function getAdminUsers(
  page = 1,
  pageSize = 50,
): Promise<AdminUserListResponse> {
  return adminUserListResponseSchema.parse(
    await getJson(`/api/v1/admin/users?page=${page}&pageSize=${pageSize}`),
  );
}

export async function getAdminSubscriptions(
  page = 1,
  pageSize = 50,
): Promise<AdminSubscriptionListResponse> {
  return adminSubscriptionListResponseSchema.parse(
    await getJson(
      `/api/v1/admin/subscriptions?page=${page}&pageSize=${pageSize}`,
    ),
  );
}

export async function getAdminInviteCodes(page = 1, pageSize = 50) {
  return adminMembershipInviteListResponseSchema.parse(
    await getJson(
      `/api/v1/admin/membership-invite-codes?page=${page}&pageSize=${pageSize}`,
    ),
  );
}

export async function getAdminRiskEvents(
  page = 1,
  pageSize = 50,
): Promise<AdminRiskEventListResponse> {
  return adminRiskEventListResponseSchema.parse(
    await getJson(
      `/api/v1/admin/risk-events?page=${page}&pageSize=${pageSize}`,
    ),
  );
}

export async function getAdminRoles(): Promise<AdminRoleListResponse> {
  return adminRoleListResponseSchema.parse(
    await getJson("/api/v1/admin/roles"),
  );
}

export async function getAdminAccounts(): Promise<AdminAccountListResponse> {
  return adminAccountListResponseSchema.parse(
    await getJson("/api/v1/admin/admin-users"),
  );
}

export async function getAdminAnnouncements(
  page = 1,
  pageSize = 20,
): Promise<AdminAnnouncementListResponse> {
  return adminAnnouncementListResponseSchema.parse(
    await getJson(
      `/api/v1/admin/announcements?page=${page}&pageSize=${pageSize}`,
    ),
  );
}
