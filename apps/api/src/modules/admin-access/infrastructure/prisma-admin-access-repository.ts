import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service.js";
import type {
  AdminAccessRepository,
  AuditLogListItem,
  AuditWriteInput,
  Paginated,
} from "../domain/admin-access-repository.js";
import { toPermissionKey } from "../domain/admin-permissions.js";

@Injectable()
export class PrismaAdminAccessRepository implements AdminAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPermissionKeys(adminUserId: string): Promise<string[]> {
    const rows = await this.prisma.adminUserRole.findMany({
      where: { adminUserId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: { resource: true, action: true },
                },
              },
            },
          },
        },
      },
    });

    const keys = new Set<string>();
    for (const row of rows) {
      for (const permission of row.role.permissions) {
        keys.add(
          toPermissionKey(
            permission.permission.resource,
            permission.permission.action,
          ),
        );
      }
    }

    return [...keys];
  }

  async writeAuditLog(input: AuditWriteInput): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorAdminId: input.actorAdminId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        strategyId: input.strategyId ?? null,
        reason: input.reason,
        before: input.before as object | undefined,
        after: input.after as object | undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async listAuditLogs(
    page: number,
    pageSize: number,
  ): Promise<Paginated<AuditLogListItem>> {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.count(),
      this.prisma.adminAuditLog.findMany({
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          actorAdmin: { select: { email: true } },
        },
      }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        actorAdminId: row.actorAdminId,
        actorEmail: row.actorAdmin?.email ?? null,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        reason: row.reason,
        before: row.before,
        after: row.after,
        ip: row.ip,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }
}
