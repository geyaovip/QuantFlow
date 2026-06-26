export type AdminPermissionKey = `${string}:${string}`;

export const ADMIN_PERMISSIONS = {
  dashboardRead: "dashboard:read",
  usersRead: "users:read",
  usersWrite: "users:write",
  strategiesRead: "strategies:read",
  strategiesWrite: "strategies:write",
  signalsRead: "signals:read",
  signalsWrite: "signals:write",
  paperAccountsRead: "paper_accounts:read",
  paperAccountsWrite: "paper_accounts:write",
  membershipRead: "membership:read",
  membershipWrite: "membership:write",
  riskRead: "risk:read",
  riskWrite: "risk:write",
  rolesManage: "roles:manage",
  auditLogsRead: "audit_logs:read",
} as const satisfies Record<string, AdminPermissionKey>;

export function toPermissionKey(
  resource: string,
  action: string,
): AdminPermissionKey {
  return `${resource}:${action}`;
}
