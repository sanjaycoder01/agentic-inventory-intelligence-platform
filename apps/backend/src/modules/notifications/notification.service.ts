import { NOTIFICATION_STATUSES } from "./notification.constants.js";
import { NotificationModel } from "./notification.model.js";
import type {
  NotificationDTO,
  PublishNotificationInput,
} from "./notification.types.js";

export class NotificationService {
  async publish(input: PublishNotificationInput): Promise<NotificationDTO> {
    const notification = await NotificationModel.create({
      ...input,
      status: NOTIFICATION_STATUSES.PENDING,
    });

    return this.toDTO(notification);
  }

  async publishMany(
    inputs: PublishNotificationInput[],
  ): Promise<NotificationDTO[]> {
    if (inputs.length === 0) {
      return [];
    }

    const notifications = await NotificationModel.insertMany(
      inputs.map((input) => ({
        ...input,
        status: NOTIFICATION_STATUSES.PENDING,
      })),
    );

    return notifications.map((notification) => this.toDTO(notification));
  }

  async getPendingNotifications(): Promise<NotificationDTO[]> {
    const notifications = await NotificationModel.find({
      status: NOTIFICATION_STATUSES.PENDING,
    }).sort({ createdAt: 1 });

    return notifications.map((notification) => this.toDTO(notification));
  }

  private toDTO(notification: {
    eventType: NotificationDTO["eventType"];
    entityType: string;
    entityId: string;
    payload: NotificationDTO["payload"];
    status: NotificationDTO["status"];
    createdAt: Date;
  }): NotificationDTO {
    return {
      eventType: notification.eventType,
      entityType: notification.entityType,
      entityId: notification.entityId,
      payload: notification.payload,
      status: notification.status,
      createdAt: notification.createdAt,
    };
  }
}

export const notificationService = new NotificationService();
