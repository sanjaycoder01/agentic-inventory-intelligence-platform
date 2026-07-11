import { RecommendationModel } from "../intelligence/recommendation.model.js";
import { recommendationPipelineService } from "../intelligence/recommendation-pipeline.service.js";
import { agentDecisionService } from "../intelligence/agent-decision.service.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { stockLedgerService } from "../inventory/stock-ledger.service.js";
import { purchaseOrderService } from "../purchase-orders/po.service.js";
import { warehouseFulfillmentService } from "../warehouse/warehouse-fulfillment.service.js";

/** Read-only tools exposed to the Claude assistant */
export const assistantTools = [
  {
    name: "list_pending_recommendations",
    description: "List pending and blocked replenishment recommendations",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
    handler: async () =>
      RecommendationModel.find({ status: { $in: ["PENDING", "BLOCKED"] } })
        .sort({ generatedAt: -1 })
        .limit(20)
        .lean(),
  },
  {
    name: "get_recommendation",
    description:
      "Get the latest recommendation and score breakdown for a product (runs pipeline if needed)",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
        darkStoreId: { type: "string" },
      },
      required: ["productId"],
    },
    handler: async (input: { productId: string; darkStoreId?: string }) => {
      const existing = await RecommendationModel.findOne({
        productId: input.productId,
        status: { $in: ["PENDING", "BLOCKED"] },
      })
        .sort({ generatedAt: -1 })
        .lean();

      if (existing) {
        return existing;
      }

      return recommendationPipelineService.generate({
        productId: input.productId,
        darkStoreId: input.darkStoreId,
      });
    },
  },
  {
    name: "get_inventory",
    description: "Get dark-store inventory for a product",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
        darkStoreId: { type: "string" },
      },
      required: ["productId", "darkStoreId"],
    },
    handler: async (input: { productId: string; darkStoreId: string }) =>
      inventoryService.getInventoryByProduct(input.darkStoreId, input.productId),
  },
  {
    name: "get_stock_ledger",
    description: "Get append-only stock ledger history for a product",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
        darkStoreId: { type: "string" },
      },
      required: ["productId"],
    },
    handler: async (input: { productId: string; darkStoreId?: string }) =>
      stockLedgerService.listByProduct(input.productId, input.darkStoreId, 50),
  },
  {
    name: "get_agent_decisions",
    description: "Get audit trail of intelligence pipeline decisions for a product",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
    handler: async (input: { productId: string }) =>
      agentDecisionService.listByProduct(input.productId, 40),
  },
  {
    name: "list_purchase_orders",
    description: "List purchase orders, optionally filtered by status",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string" },
      },
    },
    handler: async (input: { status?: string }) =>
      purchaseOrderService.list(input.status),
  },
  {
    name: "check_fulfillment",
    description: "Check if warehouse can fulfill an order quantity",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["productId", "quantity"],
    },
    handler: async (input: { productId: string; quantity: number }) =>
      warehouseFulfillmentService.checkFulfillment(input.productId, input.quantity),
  },
];

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const tool = assistantTools.find((t) => t.name === name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(input as never);
}
