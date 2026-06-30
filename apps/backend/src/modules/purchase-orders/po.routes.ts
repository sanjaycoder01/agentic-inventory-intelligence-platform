import { Router } from "express";
import { z } from "zod";
import { purchaseOrderService } from "./po.service.js";

export const poRouter = Router();

const createPoSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
});

poRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const orders = await purchaseOrderService.list(status);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

poRouter.post("/", async (req, res, next) => {
  try {
    const body = createPoSchema.parse(req.body);
    const order = await purchaseOrderService.create(body);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

poRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const order = await purchaseOrderService.approve(
      req.params.id,
      req.body.approvedBy ?? "admin",
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
});

poRouter.post("/:id/reject", async (req, res, next) => {
  try {
    const order = await purchaseOrderService.reject(
      req.params.id,
      req.body.approvedBy ?? "admin",
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
});
