import { Schema, model, type InferSchemaType } from "mongoose";

export const SALES_ACTION_TYPES = [
  "PROMOTION",
  "MARKETING_CAMPAIGN",
  "BUNDLE_DEFINITION",
  "PRICING_REVIEW_TASK",
  "QA_INVESTIGATION_TASK",
] as const;

export type SalesActionType = (typeof SALES_ACTION_TYPES)[number];

export const SALES_ACTION_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;

const salesActionSchema = new Schema(
  {
    actionId: { type: String, required: true, unique: true, index: true },
    actionType: {
      type: String,
      enum: SALES_ACTION_TYPES,
      required: true,
      index: true,
    },
    recommendationId: { type: String, required: true, index: true },
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
    strategy: { type: String, required: true },
    discountPercent: { type: Number, min: 0, max: 100 },
    title: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: SALES_ACTION_STATUSES,
      required: true,
      default: "DRAFT",
      index: true,
    },
    createdBy: { type: String, default: "admin" },
  },
  {
    timestamps: true,
    collection: "salesActions",
  },
);

export type SalesActionDocument = InferSchemaType<typeof salesActionSchema>;
export const SalesActionModel = model("SalesAction", salesActionSchema);
