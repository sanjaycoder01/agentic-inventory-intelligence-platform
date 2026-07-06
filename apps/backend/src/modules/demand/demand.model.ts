import { Schema, model, type InferSchemaType } from "mongoose";

export const CART_EVENT_TYPES = ["ADD_TO_CART", "REMOVE_FROM_CART"] as const;
export type CartEventType = (typeof CART_EVENT_TYPES)[number];

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
    eventType: {
      type: String,
      enum: CART_EVENT_TYPES,
      required: true,
      index: true,
    },
    eventTimestamp: { type: Date, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "cartEvents",
  },
);

cartEventSchema.index(
  { productId: 1, eventTimestamp: -1 },
  { name: "idx_cart_events_product_eventTimestamp" },
);
cartEventSchema.index({ darkStoreId: 1, productId: 1, eventTimestamp: -1 });

export type CartEventDocument = InferSchemaType<typeof cartEventSchema>;
export const CartEventModel = model("CartEvent", cartEventSchema);
