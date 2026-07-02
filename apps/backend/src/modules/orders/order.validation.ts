import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { ORDER_STATUSES } from "./order.model.js";

export const createOrderSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  darkStoreId: z.string().trim().min(1, "Dark store ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  sessionId: z.string().trim().min(1, "Session ID is required"),
  sellingPrice: z
    .number()
    .min(0, "Selling price must be greater than or equal to 0")
    .optional(),
  orderStatus: z.enum(ORDER_STATUSES).default("DELIVERED"),
});

export const productIdParamSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;

export const validateCreateOrder = validate({ body: createOrderSchema });
export const validateProductIdParam = validate({ params: productIdParamSchema });
