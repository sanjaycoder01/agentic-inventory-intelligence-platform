import { z } from "zod";
import { validate } from "../../middleware/validate.js";

export const createProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Product name is required"),
  category: z.string().trim().min(1, "Category is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  sellingPrice: z.number().min(0, "Selling price must be greater than or equal to 0"),
  reorderThreshold: z.number().min(0, "Reorder threshold must be greater than or equal to 0"),
  safetyStock: z.number().min(0, "Safety stock must be greater than or equal to 0"),
  shelfLifeDays: z.number().min(0, "Shelf life must be greater than or equal to 0").optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required").optional(),
    category: z.string().trim().min(1, "Category is required").optional(),
    brand: z.string().trim().min(1, "Brand is required").optional(),
    sellingPrice: z
      .number()
      .min(0, "Selling price must be greater than or equal to 0")
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required to update",
  });

export const productIdParamSchema = z.object({
  id: z.string().trim().min(1, "Product ID is required"),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

export const validateCreateProduct = validate({ body: createProductSchema });
export const validateUpdateProduct = validate({
  params: productIdParamSchema,
  body: updateProductSchema,
});
export const validateProductIdParam = validate({ params: productIdParamSchema });
