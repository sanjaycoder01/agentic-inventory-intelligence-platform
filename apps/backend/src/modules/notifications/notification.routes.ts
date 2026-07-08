import { Router } from "express";
import { notificationService } from "./notification.service.js";

export const notificationRouter = Router();

notificationRouter.get("/", async (_req, res, next) => {
  try {
    const notifications = await notificationService.getPendingNotifications();
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});
