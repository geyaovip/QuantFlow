import { describe, expect, it, vi } from "vitest";

import { AdminAccessService } from "./admin-access.service.js";
import type { AdminAccessRepository } from "../domain/admin-access-repository.js";
import { AdminPermissionDeniedError } from "../domain/admin-access-errors.js";
import { ADMIN_PERMISSIONS } from "../domain/admin-permissions.js";

describe("AdminAccessService", () => {
  it("allows admins with the required permission", async () => {
    const repository: AdminAccessRepository = {
      listPermissionKeys: vi
        .fn()
        .mockResolvedValue([
          ADMIN_PERMISSIONS.strategiesRead,
          ADMIN_PERMISSIONS.auditLogsRead,
        ]),
      writeAuditLog: vi.fn(),
      listAuditLogs: vi.fn(),
    };
    const service = new AdminAccessService(repository);

    await expect(
      service.assertPermission("admin-1", ADMIN_PERMISSIONS.strategiesRead),
    ).resolves.toBeUndefined();
  });

  it("rejects admins without the required permission", async () => {
    const repository: AdminAccessRepository = {
      listPermissionKeys: vi
        .fn()
        .mockResolvedValue([ADMIN_PERMISSIONS.auditLogsRead]),
      writeAuditLog: vi.fn(),
      listAuditLogs: vi.fn(),
    };
    const service = new AdminAccessService(repository);

    await expect(
      service.assertPermission("admin-1", ADMIN_PERMISSIONS.strategiesWrite),
    ).rejects.toBeInstanceOf(AdminPermissionDeniedError);
  });
});
