import { Inject, Injectable } from "@nestjs/common";

import type { AdminPermissionKey } from "../domain/admin-permissions.js";
import { AdminPermissionDeniedError } from "../domain/admin-access-errors.js";
import {
  ADMIN_ACCESS_REPOSITORY,
  type AdminAccessRepository,
  type AuditWriteInput,
} from "../domain/admin-access-repository.js";

@Injectable()
export class AdminAccessService {
  constructor(
    @Inject(ADMIN_ACCESS_REPOSITORY)
    private readonly repository: AdminAccessRepository,
  ) {}

  async assertPermission(
    adminUserId: string,
    permission: AdminPermissionKey,
  ): Promise<void> {
    const permissions = await this.repository.listPermissionKeys(adminUserId);
    if (!permissions.includes(permission)) {
      throw new AdminPermissionDeniedError(permission);
    }
  }

  writeAuditLog(input: AuditWriteInput) {
    return this.repository.writeAuditLog(input);
  }

  listAuditLogs(page: number, pageSize: number) {
    return this.repository.listAuditLogs(page, pageSize);
  }
}
