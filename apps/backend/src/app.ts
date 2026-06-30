import cors from "cors";
import express from "express";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { demandRouter } from "./modules/demand/demand.routes.js";
import { intelligenceRouter } from "./modules/intelligence/intelligence.routes.js";
import { warehouseRouter } from "./modules/warehouse/warehouse.routes.js";
import { poRouter } from "./modules/purchase-orders/po.routes.js";
import { assistantRouter } from "./modules/assistant/assistant.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/inventory", inventoryRouter);
  app.use("/api/demand", demandRouter);
  app.use("/api/intelligence", intelligenceRouter);
  app.use("/api/warehouse", warehouseRouter);
  app.use("/api/purchase-orders", poRouter);
  app.use("/api/assistant", assistantRouter);

  return app;
}
