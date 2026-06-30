import { Schema, model, type InferSchemaType } from "mongoose";

const purchaseOrderSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: { type: String },
    approvedBy: { type: String },
  },
  { timestamps: true },
);

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model("PurchaseOrder", purchaseOrderSchema);
