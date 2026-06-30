import { Schema, model, type InferSchemaType } from "mongoose";

const inventoryBatchSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    receivedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const inventorySchema = new Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    productName: { type: String, required: true },
    category: { type: String, required: true },
    safetyStock: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    batches: [inventoryBatchSchema],
  },
  { timestamps: true },
);

export type InventoryDocument = InferSchemaType<typeof inventorySchema>;
export const InventoryModel = model("Inventory", inventorySchema);
