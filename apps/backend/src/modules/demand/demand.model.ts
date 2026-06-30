import { Schema, model, type InferSchemaType } from "mongoose";

const demandEventSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ["cart", "order", "rating", "return"],
      required: true,
    },
    quantity: { type: Number, min: 0 },
    rating: { type: Number, min: 1, max: 5 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export type DemandEventDocument = InferSchemaType<typeof demandEventSchema>;
export const DemandEventModel = model("DemandEvent", demandEventSchema);
