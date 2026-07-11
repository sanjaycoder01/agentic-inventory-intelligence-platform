import { Router } from "express";
import { z } from "zod";
import { RETURN_REASONS } from "./return-order.model.js";
import { returnsService } from "./returns.service.js";

export const returnsRouter = Router();

const createSchema = z.object({
  productId: z.string().min(1),
  darkStoreId: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.enum(RETURN_REASONS),
  note: z.string().optional(),
});

returnsRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const returns = await returnsService.list(status as never);
    res.json({ success: true, data: returns });
  } catch (err) {
    next(err);
  }
});

returnsRouter.get("/:returnOrderId", async (req, res, next) => {
  try {
    const returnOrder = await returnsService.getById(req.params.returnOrderId);
    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
});

returnsRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const returnOrder = await returnsService.createReturn(body);
    res.status(201).json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
});

returnsRouter.post("/:returnOrderId/inspect", async (req, res, next) => {
  try {
    const decision = z.enum(["ACCEPTED", "REJECTED"]).parse(req.body.decision);
    const returnOrder = await returnsService.inspectReturn(
      req.params.returnOrderId,
      decision,
      req.body.inspectedBy ?? "admin",
    );
    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
});

returnsRouter.post("/:returnOrderId/complete", async (req, res, next) => {
  try {
    const returnOrder = await returnsService.completeReturnToWarehouse(
      req.params.returnOrderId,
    );
    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
});
