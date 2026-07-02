import { Router } from "express";
import { inventoryLegacyService } from "./inventory-legacy.service.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", async (_req, res, next) => {
  try {
    const items = await inventoryLegacyService.list();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

inventoryRouter.get("/:productId", async (req, res, next) => {
  try {
    const item = await inventoryLegacyService.getByProductId(req.params.productId);
    if (!item) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});
