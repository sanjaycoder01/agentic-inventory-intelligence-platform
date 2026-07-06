import { Schema, model, type InferSchemaType } from "mongoose";

export const ORDER_STATUSES = ["PLACED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const COMPLETED_ORDER_STATUSES = ["DELIVERED"] as const;

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
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
      index: true,
    },
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
orderSchema.index(
  { productId: 1, orderStatus: 1, orderedAt: -1 },
  { name: "idx_orders_product_status_eventTimestamp" },
);
orderSchema.index({ darkStoreId: 1, productId: 1, orderedAt: -1 });
orderSchema.index({ sessionId: 1, productId: 1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const OrderModel = model("Order", orderSchema);
