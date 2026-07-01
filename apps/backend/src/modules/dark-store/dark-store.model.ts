import { Schema, model, type InferSchemaType } from "mongoose";

const darkStoreAddressSchema = new Schema(
  {
    city: { type: String, required: true },
    area: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const darkStoreSchema = new Schema(
  {
    darkStoreCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    address: { type: darkStoreAddressSchema, required: true },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    managerName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    serviceRadiusKm: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    collection: "darkStores",
  },
);

export type DarkStoreDocument = InferSchemaType<typeof darkStoreSchema>;
export const DarkStoreModel = model("DarkStore", darkStoreSchema);
