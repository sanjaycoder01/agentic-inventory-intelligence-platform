import { z } from "zod";
import { validate } from "../../middleware/validate.js";

export const submitRatingSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  darkStoreId: z.string().trim().min(1, "Dark store ID is required"),
  orderId: z.string().trim().min(1, "Order ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  review: z.string().trim().optional(),
});

export const productIdParamSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export type SubmitRatingDTO = z.infer<typeof submitRatingSchema>;

export const validateSubmitRating = validate({ body: submitRatingSchema });
export const validateProductIdParam = validate({ params: productIdParamSchema });
