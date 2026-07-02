import { Schema, model, type InferSchemaType } from "mongoose";

const ratingSchema = new Schema(
  {
    ratingId: { type: String, required: true, unique: true, index: true },
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
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
    ratedAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "ratings",
  },
);

ratingSchema.index({ productId: 1, ratedAt: -1 });
ratingSchema.index({ darkStoreId: 1, productId: 1, ratedAt: -1 });
ratingSchema.index({ orderId: 1 }, { unique: true });

export type RatingDocument = InferSchemaType<typeof ratingSchema>;
export const RatingModel = model("Rating", ratingSchema);
