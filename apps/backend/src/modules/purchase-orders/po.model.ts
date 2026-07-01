import { Schema, model, type InferSchemaType } from "mongoose";

const purchaseOrderSchema = new Schema(
  {
    purchaseOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recommendationId: {
      type: Schema.Types.ObjectId,
      ref: "Recommendation",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
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
    orderType: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    approvedBy: { type: String, required: true },
    approvedAt: { type: Date, required: true },
    expectedDeliveryDate: { type: Date },
    completedAt: { type: Date },
    remarks: { type: String },
  },
  {
    timestamps: true,
    collection: "purchaseOrders",
  },
);

purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ warehouseId: 1, darkStoreId: 1, createdAt: -1 });

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model("PurchaseOrder", purchaseOrderSchema);
