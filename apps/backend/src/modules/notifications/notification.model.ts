import { Schema, model, type InferSchemaType } from "mongoose";

import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_STATUSES,
} from "./notification.constants.js";

const notificationSchema = new Schema(
  {
    eventType: {
      type: String,
      enum: Object.values(NOTIFICATION_EVENT_TYPES),
      required: true,
      index: true,
    },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true, default: {} },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUSES),
      required: true,
      index: true,
      default: NOTIFICATION_STATUSES.PENDING,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

notificationSchema.index({ status: 1, createdAt: 1 });
notificationSchema.index({ eventType: 1, createdAt: -1 });
notificationSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const NotificationModel = model("Notification", notificationSchema);
