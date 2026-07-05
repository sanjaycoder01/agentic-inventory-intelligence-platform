import type {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_STATUSES,
} from "./notification.constants.js";

export type NotificationEventType =
  (typeof NOTIFICATION_EVENT_TYPES)[keyof typeof NOTIFICATION_EVENT_TYPES];

export type NotificationStatus =
  (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];

export type NotificationPayload = Record<string, unknown>;

export interface PublishNotificationInput {
  eventType: NotificationEventType;
  entityType: string;
  entityId: string;
  payload: NotificationPayload;
}

export interface NotificationDTO extends PublishNotificationInput {
  status: NotificationStatus;
  createdAt: Date;
}
