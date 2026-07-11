import { Schema, model, type InferSchemaType } from "mongoose";

export const RETURN_STATUSES = [
  "REQUESTED",
  "INSPECTED",
  "ACCEPTED",
  "REJECTED",
  "RETURNED_TO_WAREHOUSE",
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_REASONS = [
  "NEAR_EXPIRY",
  "EXCESS_STOCK",
  "CUSTOMER_RETURN",
  "DAMAGE",
  "OTHER",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];

const returnOrderSchema = new Schema(
  {
    returnOrderId: { type: String, required: true, unique: true, index: true },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    darkStoreId: {
      type: Schema.Types.ObjectId,
      ref: "DarkStore",
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      index: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    reason: {
      type: String,
      enum: RETURN_REASONS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: RETURN_STATUSES,
      required: true,
      index: true,
      default: "REQUESTED",
    },
    note: { type: String },
    inspectedBy: { type: String },
    inspectedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "returnOrders",
  },
);

returnOrderSchema.index({ darkStoreId: 1, createdAt: -1 });
returnOrderSchema.index({ productId: 1, createdAt: -1 });

export type ReturnOrderDocument = InferSchemaType<typeof returnOrderSchema>;
export const ReturnOrderModel = model("ReturnOrder", returnOrderSchema);
