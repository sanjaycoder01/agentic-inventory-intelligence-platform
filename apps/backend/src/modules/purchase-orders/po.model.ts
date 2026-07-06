import { Schema, model, type InferSchemaType } from "mongoose";

export const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT_TO_VENDOR",
  "RECEIVED",
  "COMPLETED",
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

const purchaseOrderSchema = new Schema(
  {
    purchaseOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recommendationId: {
      type: String,
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
    orderType: { type: String, required: true, index: true, default: "REPLENISHMENT" },
    status: {
      type: String,
      enum: PURCHASE_ORDER_STATUSES,
      required: true,
      index: true,
      default: "DRAFT",
    },
    createdBy: { type: String, required: true, default: "SYSTEM" },
    approvedBy: { type: String },
    approvedAt: { type: Date },
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
purchaseOrderSchema.index(
  { warehouseId: 1, status: 1, createdAt: -1 },
  { name: "idx_po_warehouse_status_createdAt" },
);

export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel = model("PurchaseOrder", purchaseOrderSchema);
