import { Schema, model, type InferSchemaType } from "mongoose";

export const AGENT_DECISION_NODES = [
  "AGGREGATE_SIGNALS",
  "ELIGIBILITY",
  "RECOMMENDATION",
  "WAREHOUSE_CHECK",
  "EXPLANATION",
  "PERSIST",
  // Phase 2 — sales optimization
  "AGGREGATE_METRICS",
  "STRATEGY",
  "INVENTORY_VALIDATION",
  "SALES_EXPLANATION",
  "SALES_PERSIST",
] as const;

export type AgentDecisionNode = (typeof AGENT_DECISION_NODES)[number];

const agentDecisionSchema = new Schema(
  {
    decisionId: { type: String, required: true, unique: true, index: true },
    runId: { type: String, required: true, index: true },
    nodeName: {
      type: String,
      enum: AGENT_DECISION_NODES,
      required: true,
      index: true,
    },
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
    relatedRecommendationId: { type: String, index: true },
    inputSummary: { type: Schema.Types.Mixed, required: true },
    outputSummary: { type: Schema.Types.Mixed, required: true },
    reasoningText: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "agentDecisions",
  },
);

agentDecisionSchema.index({ productId: 1, createdAt: -1 });
agentDecisionSchema.index({ runId: 1, createdAt: 1 });

export type AgentDecisionDocument = InferSchemaType<typeof agentDecisionSchema>;
export const AgentDecisionModel = model("AgentDecision", agentDecisionSchema);
