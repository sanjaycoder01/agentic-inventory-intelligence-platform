import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { CART_EVENT_TYPES } from "./demand.model.js";

export const recordCartEventSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  darkStoreId: z.string().trim().min(1, "Dark store ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer").default(1),
  sessionId: z.string().trim().min(1, "Session ID is required"),
  eventType: z.enum(CART_EVENT_TYPES).default("ADD_TO_CART"),
});

export const productIdParamSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export type RecordCartEventDTO = z.infer<typeof recordCartEventSchema>;

export const validateRecordCartEvent = validate({ body: recordCartEventSchema });
export const validateProductIdParam = validate({ params: productIdParamSchema });
