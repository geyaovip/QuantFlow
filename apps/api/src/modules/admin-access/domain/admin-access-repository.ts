export type AuditWriteInput = {
  actorAdminId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  strategyId?: string | null;
  reason: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

export type AuditLogListItem = {
  id: string;
  actorAdminId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  reason: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export const ADMIN_ACCESS_REPOSITORY = Symbol("ADMIN_ACCESS_REPOSITORY");

export interface AdminAccessRepository {
  listPermissionKeys(adminUserId: string): Promise<string[]>;
  writeAuditLog(input: AuditWriteInput): Promise<void>;
  listAuditLogs(
    page: number,
    pageSize: number,
  ): Promise<Paginated<AuditLogListItem>>;
}
