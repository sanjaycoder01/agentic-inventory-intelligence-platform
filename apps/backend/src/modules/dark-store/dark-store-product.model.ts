import { Schema, model, type InferSchemaType } from "mongoose";

const darkStoreProductSchema = new Schema(
  {
    darkStoreId: {
      type: Schema.Types.ObjectId,
      ref: "DarkStore",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    availableQuantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },
    damagedQuantity: { type: Number, required: true, min: 0, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, min: 0, default: 0 },
    lastTransferredAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "darkStoreProducts",
  },
);

darkStoreProductSchema.index(
  { darkStoreId: 1, productId: 1 },
  { unique: true, name: "idx_darkstore_product_unique" },
);

export type DarkStoreProductDocument = InferSchemaType<
  typeof darkStoreProductSchema
>;
export const DarkStoreProductModel = model(
  "DarkStoreProduct",
  darkStoreProductSchema,
);
