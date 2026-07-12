import { Schema, model, type InferSchemaType } from "mongoose";

export const RECOMMENDATION_TYPES = [
  "REORDER",
  "DONT_REORDER",
  "DO_NOT_REORDER",
  "NO_ACTION",
  "APPLY_DISCOUNT",
  "INCREASE_ADS",
  "BUNDLE_PRODUCT",
  "RETURN_TO_WAREHOUSE",
  // Phase 2 — sales optimization
  "DISCOUNT",
  "BUNDLE",
  "RUN_ADS",
  "PRICE_REVIEW",
  "QUALITY_CHECK",
  "CLEARANCE",
  "LIQUIDATE",
  "HOMEPAGE_HIGHLIGHT",
  "MONITOR",
] as const;

export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

export const INTELLIGENCE_TYPES = [
  "REPLENISHMENT",
  "SALES_OPTIMIZATION",
] as const;

export type IntelligenceType = (typeof INTELLIGENCE_TYPES)[number];

export const RECOMMENDATION_STATUSES = [
  "PENDING",
  "BLOCKED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;

export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

const recommendationSchema = new Schema(
  {
    recommendationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    intelligenceType: {
      type: String,
      enum: INTELLIGENCE_TYPES,
      required: true,
      default: "REPLENISHMENT",
      index: true,
    },
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
    recommendationType: {
      type: String,
      enum: RECOMMENDATION_TYPES,
      required: true,
      index: true,
    },
    recommendationReason: { type: String, required: true },
    matchedRule: { type: String, required: true, index: true },
    eligible: { type: Boolean, required: true, index: true },
    demandScore: { type: Number, required: true, min: 0, max: 1 },
    conversionScore: { type: Number, required: true, min: 0, max: 1 },
    ratingScore: { type: Number, required: true, min: 0, max: 1 },
    overallScore: { type: Number, required: true, min: 0, max: 1 },
    availableQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, min: 0 },
    warehouseStock: { type: Number, required: true, min: 0 },
    summary: { type: String, required: true },
    factors: { type: [String], required: true, default: [] },
    recommendedQuantity: { type: Number, min: 0 },
    /** Phase 2 metrics snapshot */
    metrics: { type: Schema.Types.Mixed },
    strategy: { type: String },
    discountPercent: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: RECOMMENDATION_STATUSES,
      required: true,
      index: true,
    },
    generatedAt: { type: Date, required: true, index: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectedBy: { type: String },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    /** Phase 2 approval side-effect reference */
    actionReferenceId: { type: String },
  },
  {
    timestamps: true,
    collection: "recommendations",
  },
);

recommendationSchema.index({ darkStoreId: 1, generatedAt: -1 });
recommendationSchema.index({ productId: 1, generatedAt: -1 });
recommendationSchema.index({ status: 1, generatedAt: -1 });
recommendationSchema.index(
  { darkStoreId: 1, status: 1, generatedAt: -1 },
  { name: "idx_recommendations_darkStore_status_generatedAt" },
);
recommendationSchema.index(
  { intelligenceType: 1, status: 1, generatedAt: -1 },
  { name: "idx_recommendations_intelligence_status_generatedAt" },
);

export type RecommendationDocument = InferSchemaType<
  typeof recommendationSchema
>;
export const RecommendationModel = model(
  "Recommendation",
  recommendationSchema,
);
