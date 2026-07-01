import { Schema, model, type InferSchemaType } from "mongoose";

export const RECOMMENDATION_TYPES = [
  "REORDER",
  "DONT_REORDER",
  "APPLY_DISCOUNT",
  "INCREASE_ADS",
  "BUNDLE_PRODUCT",
  "RETURN_TO_WAREHOUSE",
] as const;

export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

const recommendationSchema = new Schema(
  {
    recommendationId: {
      type: String,
      required: true,
      unique: true,
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
      required: true,
      index: true,
    },
    recommendationType: {
      type: String,
      enum: RECOMMENDATION_TYPES,
      required: true,
      index: true,
    },
    recommendationReason: { type: String, required: true },
    demandScore: { type: Number, required: true, min: 0, max: 1 },
    conversionScore: { type: Number, required: true, min: 0, max: 1 },
    ratingScore: { type: Number, required: true, min: 0, max: 1 },
    overallScore: { type: Number, required: true, min: 0, max: 1 },
    recommendedQuantity: { type: Number, min: 0 },
    status: { type: String, required: true, index: true },
    generatedAt: { type: Date, required: true, index: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "recommendations",
  },
);

recommendationSchema.index({ darkStoreId: 1, generatedAt: -1 });
recommendationSchema.index({ productId: 1, generatedAt: -1 });
recommendationSchema.index({ status: 1, generatedAt: -1 });

export type RecommendationDocument = InferSchemaType<
  typeof recommendationSchema
>;
export const RecommendationModel = model(
  "Recommendation",
  recommendationSchema,
);
