import { Schema, model, type InferSchemaType } from "mongoose";

const cartEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
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
    quantity: { type: Number, required: true, min: 1, default: 1 },
    eventType: { type: String, required: true, index: true },
    eventTimestamp: { type: Date, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "cartEvents",
  },
);

cartEventSchema.index({ productId: 1, eventTimestamp: -1 });
cartEventSchema.index({ darkStoreId: 1, productId: 1, eventTimestamp: -1 });

export type CartEventDocument = InferSchemaType<typeof cartEventSchema>;
export const CartEventModel = model("CartEvent", cartEventSchema);
