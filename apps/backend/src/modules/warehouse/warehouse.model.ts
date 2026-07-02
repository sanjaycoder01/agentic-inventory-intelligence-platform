import { Schema, model, type InferSchemaType } from "mongoose";

export const WAREHOUSE_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "UNDER_MAINTENANCE",
] as const;

export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

const warehouseAddressSchema = new Schema(
  {
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const warehouseSchema = new Schema(
  {
    warehouseCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    address: { type: warehouseAddressSchema, required: true },
    contactPerson: { type: String, required: true },
    contactNumber: { type: String, required: true },
    storageCapacity: { type: Number, required: true, min: 1 },
    currentUtilization: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: WAREHOUSE_STATUSES,
      required: true,
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "warehouses",
  },
);

export type WarehouseDocument = InferSchemaType<typeof warehouseSchema>;
export const WarehouseModel = model("Warehouse", warehouseSchema);
