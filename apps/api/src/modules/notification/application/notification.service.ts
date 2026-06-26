import { Inject, Injectable } from "@nestjs/common";

import { NotificationNotFoundError } from "../domain/notification-errors.js";
import {
  NOTIFICATION_REPOSITORY,
  type CreateNotificationInput,
  type NotificationPreferenceItem,
  type NotificationRepository,
} from "../domain/notification-repository.js";

const DEFAULT_PREFERENCES: NotificationPreferenceItem[] = [
  { channel: "in_app", type: "system", enabled: true },
  { channel: "in_app", type: "signal", enabled: true },
  { channel: "in_app", type: "risk", enabled: true },
  { channel: "in_app", type: "membership", enabled: true },
];

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  listNotifications(userId: string, page: number, pageSize: number) {
    return this.repository.listNotifications(userId, page, pageSize);
  }

  async markNotificationRead(userId: string, notificationId: string) {
    try {
      return await this.repository.markNotificationRead(userId, notificationId);
    } catch {
      throw new NotificationNotFoundError();
    }
  }

  async listPreferences(userId: string) {
    const preferences = await this.repository.listPreferences(userId);
    if (preferences.length) {
      return preferences;
    }
    return this.repository.updatePreferences(userId, DEFAULT_PREFERENCES);
  }

  updatePreferences(userId: string, preferences: NotificationPreferenceItem[]) {
    return this.repository.updatePreferences(userId, preferences);
  }

  async notifyUser(input: CreateNotificationInput) {
    const enabled = await this.repository.isNotificationEnabled(
      input.userId,
      input.type,
    );
    if (!enabled) {
      return;
    }
    await this.repository.createNotification(input);
  }

  async notifyStrategyPausedPaperAccounts(
    strategyId: string,
    strategyName: string,
  ) {
    const userIds =
      await this.repository.listPaperAccountUserIdsByStrategy(strategyId);
    await Promise.all(
      userIds.map((userId) =>
        this.notifyUser({
          userId,
          type: "risk",
          title: "模拟盘已因策略暂停而暂停",
          content: `策略「${strategyName}」已暂停，你的相关模拟盘已切换为策略暂停状态。请确认策略恢复后再尝试继续运行。`,
        }),
      ),
    );
  }

  async notifySignalSubscribers(signalId: string) {
    const signal = await this.repository.findSignalSummary(signalId);
    if (!signal) {
      return;
    }

    const userIds = await this.repository.listStrategySubscriberUserIds(
      signal.strategyId,
    );
    await Promise.all(
      userIds.map((userId) =>
        this.notifyUser({
          userId,
          type: "signal",
          title: `${signal.strategyName} 有新信号提醒`,
          content: `${signal.symbol} · ${signal.direction} 方向信号已更新，请前往信号中心查看详情与风险说明。`,
        }),
      ),
    );
  }

  async notifyMembershipActivated(userId: string, planName: string) {
    await this.notifyUser({
      userId,
      type: "membership",
      title: "会员已开通",
      content: `你的 ${planName} 会员已生效，可查看对应策略、信号与模拟盘配额。QuantFlow 不提供投资建议，不承诺任何收益。`,
    });
  }
}
