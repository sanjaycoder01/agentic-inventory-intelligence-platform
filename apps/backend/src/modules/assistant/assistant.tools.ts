import { inventoryService } from "../inventory/inventory.service.js";
import { recommendationService } from "../intelligence/recommendation.service.js";
import { purchaseOrderService } from "../purchase-orders/po.service.js";
import { warehouseService } from "../warehouse/warehouse.service.js";

/** Read-only tools exposed to the Claude assistant */
export const assistantTools = [
  {
    name: "get_inventory",
    description: "Get inventory details for a product",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
    handler: async (input: { productId: string }) =>
      inventoryService.getByProductId(input.productId),
  },
  {
    name: "get_recommendation",
    description: "Get intelligence recommendation and score breakdown for a product",
    input_schema: {
      type: "object" as const,
      properties: {
        productId: { type: "string" },
      },
      required: ["productId"],
    },
    handler: async (input: { productId: string }) =>
      recommendationService.generateForProduct(input.productId),
  },
  {
    name: "list_purchase_orders",
    description: "List purchase orders, optionally filtered by status",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["pending", "approved", "rejected"] },
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
      warehouseService.checkFulfillment(input.productId, input.quantity),
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
