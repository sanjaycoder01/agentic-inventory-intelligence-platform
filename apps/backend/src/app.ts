import cors from "cors";
import express, { type Express } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";
import { productRouter } from "./modules/products/product.routes.js";
import {
  cartEventRouter,
  demandRouter,
} from "./modules/demand/demand.routes.js";
import { orderRouter } from "./modules/orders/order.routes.js";
import { ratingRouter } from "./modules/ratings/rating.routes.js";
import { warehouseRouter } from "./modules/warehouse/warehouse.routes.js";

import { poRouter } from "./modules/purchase-orders/po.routes.js";
import { intelligenceRouter } from "./modules/intelligence/intelligence.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/warehouses", warehouseRouter);
  app.use("/api/v1/cart-events", cartEventRouter);
  app.use("/api/v1/demand", demandRouter);
  app.use("/api/v1/orders", orderRouter);
  app.use("/api/v1/ratings", ratingRouter);
  app.use("/api/v1/purchase-orders", poRouter);
  app.use("/api/v1/recommendations", intelligenceRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/notifications", notificationRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
