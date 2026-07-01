import { Schema, model, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true },
    unit: { type: String, required: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    reorderThreshold: { type: Number, required: true, min: 0 },
    safetyStock: { type: Number, required: true, min: 0 },
    shelfLifeDays: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: "products",
  },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = model("Product", productSchema);
