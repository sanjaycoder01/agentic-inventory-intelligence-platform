import { Router } from "express";
import { z } from "zod";
import { demandService } from "./demand.service.js";

export const demandRouter = Router();

const cartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().optional(),
});

const orderSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const ratingSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
});

demandRouter.post("/cart", async (req, res, next) => {
  try {
    const body = cartSchema.parse(req.body);
    const event = await demandService.recordCartEvent(
      body.productId,
      body.quantity,
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

demandRouter.post("/order", async (req, res, next) => {
  try {
    const body = orderSchema.parse(req.body);
    const event = await demandService.recordOrderEvent(
      body.productId,
      body.quantity,
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

demandRouter.post("/rating", async (req, res, next) => {
  try {
    const body = ratingSchema.parse(req.body);
    const event = await demandService.recordRating(
      body.productId,
      body.rating,
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});
