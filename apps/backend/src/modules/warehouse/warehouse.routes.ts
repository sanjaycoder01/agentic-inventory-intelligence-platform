import { Router } from "express";
import { warehouseService } from "./warehouse.service.js";

export const warehouseRouter = Router();

warehouseRouter.get("/stock", async (_req, res, next) => {
  try {
    const summary = await warehouseService.getStockSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

warehouseRouter.get("/fulfillment/:productId", async (req, res, next) => {
  try {
    const quantity = Number(req.query.quantity ?? 1);
    const result = await warehouseService.checkFulfillment(
      req.params.productId,
      quantity,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});
