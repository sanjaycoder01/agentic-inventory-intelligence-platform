import { Schema, model, type InferSchemaType } from "mongoose";

const warehouseProductSchema = new Schema(
  {
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    availableQuantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, required: true, min: 0, default: 0 },
    damagedQuantity: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    batchNumber: { type: String, index: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date, index: true },
    supplierId: { type: Schema.Types.ObjectId, index: true },
    lastRestockedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "warehouseProducts",
  },
);

warehouseProductSchema.index({ warehouseId: 1, productId: 1, batchNumber: 1 });
warehouseProductSchema.index(
  { warehouseId: 1, productId: 1 },
  { unique: true, name: "idx_warehouse_inventory_unique" },
);

export type WarehouseProductDocument = InferSchemaType<
  typeof warehouseProductSchema
>;
export const WarehouseProductModel = model(
  "WarehouseProduct",
  warehouseProductSchema,
);
