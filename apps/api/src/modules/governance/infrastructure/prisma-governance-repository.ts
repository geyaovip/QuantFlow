import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuditContext } from "../../strategy/domain/strategy-repository.js";
import type {
  AdminAccountListItem,
  AdminDashboardSummary,
  AdminRoleListItem,
  AdminSubscriptionListItem,
  AdminUserListItem,
  GovernanceRepository,
  InviteCodeCreateInput,
  InviteCodeListItem,
  ManualGrantInput,
  Paginated,
  RiskEventListItem,
  SystemAnnouncementItem,
} from "../domain/governance-repository.js";
import { toPermissionKey } from "../../admin-access/domain/admin-permissions.js";

@Injectable()
export class PrismaGovernanceRepository implements GovernanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(
    page: number,
    pageSize: number,
  ): Promise<Paginated<AdminUserListItem>> {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          membershipSubs: {
            where: { status: "active", endsAt: { gt: new Date() } },
            orderBy: { endsAt: "desc" },
            take: 1,
            include: { plan: true },
          },
          _count: {
            select: {
              paperAccounts: { where: { deletedAt: null } },
              subscriptions: { where: { status: "active" } },
            },
          },
        },
      }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        email: row.email,
        status: row.status,
        membershipTier: row.membershipSubs[0]?.plan.tier ?? "free",
        membershipPlanName: row.membershipSubs[0]?.plan.name ?? "Free",
        paperAccountCount: row._count.paperAccounts,
        strategySubscriptionCount: row._count.subscriptions,
        lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: paginate(page, pageSize, total),
    };
  }

  async updateUserStatus(
    userId: string,
    status: "active" | "disabled" | "risk_watch",
    context: AuditContext,
  ): Promise<AdminUserListItem> {
    const before = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!before) {
      throw new Error("用户不存在");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status } });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "user_status_update",
          resourceType: "user",
          resourceId: userId,
          reason: context.reason,
          before: { status: before.status },
          after: { status },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
    });

    const match = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        membershipSubs: {
          where: { status: "active", endsAt: { gt: new Date() } },
          orderBy: { endsAt: "desc" },
          take: 1,
          include: { plan: true },
        },
        _count: {
          select: {
            paperAccounts: { where: { deletedAt: null } },
            subscriptions: { where: { status: "active" } },
          },
        },
      },
    });

    return {
      id: match.id,
      email: match.email,
      status: match.status,
      membershipTier: match.membershipSubs[0]?.plan.tier ?? "free",
      membershipPlanName: match.membershipSubs[0]?.plan.name ?? "Free",
      paperAccountCount: match._count.paperAccounts,
      strategySubscriptionCount: match._count.subscriptions,
      lastLoginAt: match.lastLoginAt?.toISOString() ?? null,
      createdAt: match.createdAt.toISOString(),
    };
  }

  async listSubscriptions(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.userSubscription.count(),
      this.prisma.userSubscription.findMany({
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { user: true, plan: true },
      }),
    ]);

    return {
      data: rows.map(mapSubscription),
      pagination: paginate(page, pageSize, total),
    };
  }

  async manualGrantMembership(input: ManualGrantInput, context: AuditContext) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { tier: input.tier, status: "active" },
    });
    if (!plan) {
      throw new Error("会员计划不存在");
    }

    const now = new Date();
    const endsAt = new Date(now);
    if (input.billingCycle === "monthly") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.userSubscription.updateMany({
        where: {
          userId: input.userId,
          status: "active",
          endsAt: { gt: now },
        },
        data: { status: "cancelled", cancelledAt: now },
      });

      const subscription = await tx.userSubscription.create({
        data: {
          userId: input.userId,
          planId: plan.id,
          status: "active",
          source: "manual",
          startsAt: now,
          endsAt,
          reason: input.reason,
        },
        include: { user: true, plan: true },
      });

      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "membership_manual_grant",
          resourceType: "user_subscription",
          resourceId: subscription.id,
          reason: context.reason,
          before: Prisma.DbNull,
          after: {
            userId: input.userId,
            tier: input.tier,
            billingCycle: input.billingCycle,
          },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });

      return subscription;
    });

    return mapSubscription(created);
  }

  async cancelMembership(subscriptionId: string, context: AuditContext) {
    const existing = await this.prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true, plan: true },
    });
    if (!existing) {
      throw new Error("订阅不存在");
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.userSubscription.update({
        where: { id: subscriptionId },
        data: { status: "cancelled", cancelledAt: now },
        include: { user: true, plan: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "membership_cancel",
          resourceType: "user_subscription",
          resourceId: subscriptionId,
          reason: context.reason,
          before: { status: existing.status },
          after: { status: "cancelled" },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
      return row;
    });

    return mapSubscription(updated);
  }

  async listInviteCodes(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.membershipInviteCode.count(),
      this.prisma.membershipInviteCode.findMany({
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return {
      data: rows.map(mapInviteCode),
      pagination: paginate(page, pageSize, total),
    };
  }

  async createInviteCode(input: InviteCodeCreateInput, context: AuditContext) {
    const codeNormalized = normalizeInviteCode(input.code);
    const codeLabel = input.code.trim().toUpperCase();
    const existing = await this.prisma.membershipInviteCode.findUnique({
      where: { codeNormalized },
    });
    if (existing) {
      throw new Error("邀请码已存在");
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.membershipInviteCode.create({
        data: {
          codeNormalized,
          codeLabel,
          tier: input.tier,
          billingCycle: input.billingCycle,
          maxRedemptions: input.maxRedemptions,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          note: input.note ?? null,
          createdByAdminId: context.actorAdminId ?? null,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "membership_invite_create",
          resourceType: "membership_invite_code",
          resourceId: row.id,
          reason: context.reason,
          before: Prisma.DbNull,
          after: {
            codeLabel: row.codeLabel,
            tier: row.tier,
            billingCycle: row.billingCycle,
            maxRedemptions: row.maxRedemptions,
          },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });

      return row;
    });

    return mapInviteCode(created);
  }

  async disableInviteCode(inviteCodeId: string, context: AuditContext) {
    const existing = await this.prisma.membershipInviteCode.findUnique({
      where: { id: inviteCodeId },
    });
    if (!existing) {
      throw new Error("邀请码不存在");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.membershipInviteCode.update({
        where: { id: inviteCodeId },
        data: { status: "disabled" },
      });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "membership_invite_disable",
          resourceType: "membership_invite_code",
          resourceId: inviteCodeId,
          reason: context.reason,
          before: { status: existing.status },
          after: { status: "disabled" },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
      return row;
    });

    return mapInviteCode(updated);
  }

  async listRiskEvents(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.riskEvent.count(),
      this.prisma.riskEvent.findMany({
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return {
      data: rows.map(mapRiskEvent),
      pagination: paginate(page, pageSize, total),
    };
  }

  async updateRiskEvent(
    riskEventId: string,
    action: "assign" | "resolve" | "ignore" | "escalate",
    input: { reason: string; resolution?: string; assigneeAdminId?: string },
    context: AuditContext,
  ) {
    const existing = await this.prisma.riskEvent.findUnique({
      where: { id: riskEventId },
    });
    if (!existing) {
      throw new Error("风险事件不存在");
    }

    const statusMap = {
      assign: "assigned",
      resolve: "resolved",
      ignore: "ignored",
      escalate: "escalated",
    } as const;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.riskEvent.update({
        where: { id: riskEventId },
        data: {
          status: statusMap[action],
          assigneeAdminId:
            action === "assign"
              ? (input.assigneeAdminId ?? context.actorAdminId)
              : existing.assigneeAdminId,
          resolution: input.resolution ?? existing.resolution,
          handledAt: new Date(),
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: `risk_${action}`,
          resourceType: "risk_event",
          resourceId: riskEventId,
          reason: input.reason,
          before: { status: existing.status },
          after: { status: row.status },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
      return row;
    });

    return mapRiskEvent(updated);
  }

  async createRiskEvent(input: {
    type: string;
    level: "low" | "medium" | "high" | "critical";
    message: string;
    userId?: string | null;
    strategyId?: string | null;
    signalId?: string | null;
    paperAccountId?: string | null;
  }) {
    const row = await this.prisma.riskEvent.create({ data: input });
    return mapRiskEvent(row);
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      userCount,
      activeStrategyCount,
      signalCountToday,
      paperAccountCount,
      openRiskEventCount,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.strategy.count({
        where: { status: "active", deletedAt: null },
      }),
      this.prisma.strategySignal.count({
        where: { generatedAt: { gte: startOfDay } },
      }),
      this.prisma.paperAccount.count({ where: { deletedAt: null } }),
      this.prisma.riskEvent.count({
        where: { status: { in: ["open", "assigned", "escalated"] } },
      }),
    ]);

    return {
      userCount,
      activeStrategyCount,
      signalCountToday,
      paperAccountCount,
      openRiskEventCount,
    };
  }

  async listRoles(): Promise<AdminRoleListItem[]> {
    const rows = await this.prisma.adminRole.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: row.permissions.map((item) =>
        toPermissionKey(item.permission.resource, item.permission.action),
      ),
    }));
  }

  async listAdminAccounts(): Promise<AdminAccountListItem[]> {
    const rows = await this.prisma.adminUser.findMany({
      orderBy: { email: "asc" },
      include: { roles: { include: { role: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: row.status,
      roles: row.roles.map((item) => item.role.name),
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    }));
  }

  async assignAdminRole(
    adminUserId: string,
    roleId: string,
    context: AuditContext,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.adminUserRole.deleteMany({ where: { adminUserId } });
      await tx.adminUserRole.create({ data: { adminUserId, roleId } });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "admin_role_assign",
          resourceType: "admin_user",
          resourceId: adminUserId,
          reason: context.reason,
          before: Prisma.DbNull,
          after: { roleId },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
    });

    const rows = await this.listAdminAccounts();
    const match = rows.find((row) => row.id === adminUserId);
    if (!match) {
      throw new Error("管理员不存在");
    }
    return match;
  }

  async listAnnouncements(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.systemAnnouncement.count(),
      this.prisma.systemAnnouncement.findMany({
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return {
      data: rows.map(mapAnnouncement),
      pagination: paginate(page, pageSize, total),
    };
  }

  async createAnnouncement(
    input: { title: string; content: string; reason: string },
    context: AuditContext,
  ) {
    const row = await this.prisma.$transaction(async (tx) => {
      const announcement = await tx.systemAnnouncement.create({
        data: {
          title: input.title,
          content: input.content,
          status: "draft",
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "announcement_create",
          resourceType: "system_announcement",
          resourceId: announcement.id,
          reason: input.reason,
          before: Prisma.DbNull,
          after: { status: "draft" },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
      return announcement;
    });

    return mapAnnouncement(row);
  }

  async publishAnnouncement(announcementId: string, context: AuditContext) {
    const now = new Date();
    const row = await this.prisma.$transaction(async (tx) => {
      const announcement = await tx.systemAnnouncement.update({
        where: { id: announcementId },
        data: { status: "published", publishedAt: now },
      });
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: context.actorAdminId,
          action: "announcement_publish",
          resourceType: "system_announcement",
          resourceId: announcementId,
          reason: context.reason,
          before: { status: "draft" },
          after: { status: "published" },
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
      });
      return announcement;
    });

    return mapAnnouncement(row);
  }

  async listActiveUserIds() {
    const rows = await this.prisma.user.findMany({
      where: { status: "active" },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }
}

function paginate(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function mapSubscription(row: {
  id: string;
  userId: string;
  status: string;
  source: string;
  startsAt: Date;
  endsAt: Date;
  cancelledAt: Date | null;
  user: { email: string };
  plan: { tier: string; name: string };
}): AdminSubscriptionListItem {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    tier: row.plan.tier,
    planName: row.plan.name,
    status: row.status,
    source: row.source,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
  };
}

function mapRiskEvent(row: {
  id: string;
  type: string;
  level: string;
  status: string;
  message: string;
  userId: string | null;
  strategyId: string | null;
  signalId: string | null;
  paperAccountId: string | null;
  assigneeAdminId: string | null;
  resolution: string | null;
  handledAt: Date | null;
  createdAt: Date;
}): RiskEventListItem {
  return {
    id: row.id,
    type: row.type,
    level: row.level,
    status: row.status,
    message: row.message,
    userId: row.userId,
    strategyId: row.strategyId,
    signalId: row.signalId,
    paperAccountId: row.paperAccountId,
    assigneeAdminId: row.assigneeAdminId,
    resolution: row.resolution,
    handledAt: row.handledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapAnnouncement(row: {
  id: string;
  title: string;
  content: string;
  status: string;
  publishedAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
}): SystemAnnouncementItem {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapInviteCode(row: {
  id: string;
  codeLabel: string;
  tier: "free" | "pro" | "premium";
  billingCycle: string;
  maxRedemptions: number;
  redemptionCount: number;
  expiresAt: Date | null;
  status: "active" | "disabled";
  note: string | null;
  createdAt: Date;
}): InviteCodeListItem {
  return {
    id: row.id,
    codeLabel: row.codeLabel,
    tier: row.tier as InviteCodeListItem["tier"],
    billingCycle: row.billingCycle as InviteCodeListItem["billingCycle"],
    maxRedemptions: row.maxRedemptions,
    redemptionCount: row.redemptionCount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeInviteCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
