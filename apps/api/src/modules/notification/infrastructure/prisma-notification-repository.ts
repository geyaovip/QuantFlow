import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service.js";
import { NotificationNotFoundError } from "../domain/notification-errors.js";
import type {
  CreateNotificationInput,
  NotificationListItem,
  NotificationPreferenceItem,
  NotificationRepository,
  NotificationType,
  Paginated,
} from "../domain/notification-repository.js";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<NotificationListItem>> {
    const skip = (page - 1) * pageSize;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.userNotification.count({ where: { userId } }),
      this.prisma.userNotification.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return {
      data: rows.map(mapNotification),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async markNotificationRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationListItem> {
    const existing = await this.prisma.userNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) {
      throw new NotificationNotFoundError();
    }

    const updated = await this.prisma.userNotification.update({
      where: { id: notificationId },
      data: { readAt: existing.readAt ?? new Date() },
    });

    return mapNotification(updated);
  }

  async listPreferences(userId: string): Promise<NotificationPreferenceItem[]> {
    const rows = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }],
    });

    return rows.map((row) => ({
      channel: row.channel,
      type: row.type,
      enabled: row.enabled,
    }));
  }

  async updatePreferences(
    userId: string,
    preferences: NotificationPreferenceItem[],
  ): Promise<NotificationPreferenceItem[]> {
    await this.prisma.$transaction(
      preferences.map((preference) =>
        this.prisma.notificationPreference.upsert({
          where: {
            userId_channel_type: {
              userId,
              channel: preference.channel,
              type: preference.type,
            },
          },
          create: {
            userId,
            channel: preference.channel,
            type: preference.type,
            enabled: preference.enabled,
          },
          update: { enabled: preference.enabled },
        }),
      ),
    );

    return this.listPreferences(userId);
  }

  async createNotification(input: CreateNotificationInput): Promise<void> {
    await this.prisma.userNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
      },
    });
  }

  async isNotificationEnabled(
    userId: string,
    type: NotificationType,
    channel: "in_app" = "in_app",
  ): Promise<boolean> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_channel_type: { userId, channel, type },
      },
    });

    return preference?.enabled ?? true;
  }

  async listPaperAccountUserIdsByStrategy(
    strategyId: string,
  ): Promise<string[]> {
    const rows = await this.prisma.paperAccount.findMany({
      where: {
        strategyId,
        deletedAt: null,
        status: "strategy_paused",
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    return rows.map((row) => row.userId);
  }

  async listStrategySubscriberUserIds(strategyId: string): Promise<string[]> {
    const rows = await this.prisma.userStrategySubscription.findMany({
      where: { strategyId, status: "active" },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  async findSignalSummary(signalId: string) {
    const signal = await this.prisma.strategySignal.findUnique({
      where: { id: signalId },
      include: { strategy: { select: { name: true } } },
    });
    if (!signal) {
      return null;
    }
    return {
      strategyId: signal.strategyId,
      strategyName: signal.strategy.name,
      symbol: signal.symbol,
      direction: signal.direction,
    };
  }
}

function mapNotification(row: {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
}): NotificationListItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
