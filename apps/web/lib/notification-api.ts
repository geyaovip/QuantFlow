import {
  notificationListResponseSchema,
  notificationPreferenceListResponseSchema,
  type NotificationListResponse,
  type NotificationPreferenceListResponse,
} from "@quantflow/contracts";

import { getJson } from "./strategy-api";

export async function getNotifications(
  page = 1,
  pageSize = 20,
): Promise<NotificationListResponse> {
  const payload = await getJson(
    `/api/v1/notifications?page=${page}&pageSize=${pageSize}`,
  );
  return notificationListResponseSchema.parse(payload);
}

export async function getNotificationPreferences(): Promise<NotificationPreferenceListResponse> {
  const payload = await getJson("/api/v1/notification-preferences");
  return notificationPreferenceListResponseSchema.parse(payload);
}
