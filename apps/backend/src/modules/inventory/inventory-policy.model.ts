import { Schema, model, type InferSchemaType } from "mongoose";

export const LOCATION_TYPES = ["WAREHOUSE", "DARK_STORE"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

const inventoryPolicySchema = new Schema(
  {
    locationType: {
      type: String,
      enum: LOCATION_TYPES,
      required: true,
      index: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    minimumStockLevel: { type: Number, required: true, min: 0 },
    maximumStockLevel: { type: Number, required: true, min: 0 },
    reorderQuantity: { type: Number, required: true, min: 0 },
    safetyStock: { type: Number, required: true, min: 0 },
    isAutoReorderEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "inventoryPolicies",
  },
);

inventoryPolicySchema.index(
  { locationType: 1, locationId: 1, productId: 1 },
  { unique: true },
);

export type InventoryPolicyDocument = InferSchemaType<
  typeof inventoryPolicySchema
>;
export const InventoryPolicyModel = model(
  "InventoryPolicy",
  inventoryPolicySchema,
);
