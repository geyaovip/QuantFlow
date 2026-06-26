export type NotificationType = "system" | "signal" | "risk" | "membership";
export type NotificationChannel = "in_app";

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferenceItem = {
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
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

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
};

export const NOTIFICATION_REPOSITORY = Symbol("NOTIFICATION_REPOSITORY");

export interface NotificationRepository {
  listNotifications(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<Paginated<NotificationListItem>>;
  markNotificationRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationListItem>;
  listPreferences(userId: string): Promise<NotificationPreferenceItem[]>;
  updatePreferences(
    userId: string,
    preferences: NotificationPreferenceItem[],
  ): Promise<NotificationPreferenceItem[]>;
  createNotification(input: CreateNotificationInput): Promise<void>;
  isNotificationEnabled(
    userId: string,
    type: NotificationType,
    channel?: NotificationChannel,
  ): Promise<boolean>;
  listPaperAccountUserIdsByStrategy(strategyId: string): Promise<string[]>;
  listStrategySubscriberUserIds(strategyId: string): Promise<string[]>;
  findSignalSummary(signalId: string): Promise<{
    strategyId: string;
    strategyName: string;
    symbol: string;
    direction: string;
  } | null>;
}
