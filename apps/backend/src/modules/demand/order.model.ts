import { Schema, model, type InferSchemaType } from "mongoose";

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
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
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true, min: 0 },
    orderStatus: { type: String, required: true, index: true },
    orderedAt: { type: Date, required: true, index: true },
    deliveredAt: { type: Date },
    sessionId: { type: String, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "orders",
  },
);

orderSchema.index({ productId: 1, orderedAt: -1 });
orderSchema.index({ darkStoreId: 1, productId: 1, orderedAt: -1 });
orderSchema.index({ sessionId: 1, productId: 1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const OrderModel = model("Order", orderSchema);
