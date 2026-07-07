import type { PipelineStage } from "mongoose";

export const buildWarehouseDashboardPipeline = (warehouseId?: any): PipelineStage[] => {
  const pipeline: PipelineStage[] = [];

  if (warehouseId) {
    pipeline.push({
      $match: { _id: warehouseId },
    });
  }

  pipeline.push(
    // 1. Inventory (WarehouseProducts)
    {
      $lookup: {
        from: "warehouseProducts",
        localField: "_id",
        foreignField: "warehouseId",
        as: "inventory",
      },
    },
    // 2. Purchase Orders
    {
      $lookup: {
        from: "purchaseOrders",
        localField: "_id",
        foreignField: "warehouseId",
        as: "purchaseOrders",
      },
    },
    // 3. Recommendations
    {
      $lookup: {
        from: "recommendations",
        localField: "_id",
        foreignField: "warehouseId",
        as: "recommendations",
      },
    },
    {
      $project: {
        _id: 0,
        warehouseId: { $toString: "$_id" },
        warehouseName: "$name",
        totalProducts: { $size: "$inventory" },
        totalAvailableInventory: { $sum: "$inventory.availableQuantity" },
        totalReservedInventory: { $sum: "$inventory.reservedQuantity" },
        draftPurchaseOrders: {
          $size: {
            $filter: {
              input: "$purchaseOrders",
              as: "po",
              cond: { $eq: ["$$po.status", "DRAFT"] },
            },
          },
        },
        pendingApprovalPurchaseOrders: {
          $size: {
            $filter: {
              input: "$purchaseOrders",
              as: "po",
              cond: { $eq: ["$$po.status", "PENDING_APPROVAL"] },
            },
          },
        },
        approvedPurchaseOrders: {
          $size: {
            $filter: {
              input: "$purchaseOrders",
              as: "po",
              cond: { $eq: ["$$po.status", "APPROVED"] },
            },
          },
        },
        completedPurchaseOrders: {
          $size: {
            $filter: {
              input: "$purchaseOrders",
              as: "po",
              cond: { $eq: ["$$po.status", "COMPLETED"] },
            },
          },
        },
        pendingRecommendations: {
          $size: {
            $filter: {
              input: "$recommendations",
              as: "rec",
              cond: { $eq: ["$$rec.status", "PENDING"] },
            },
          },
        },
        utilizationPercentage: {
          $cond: [
            { $gt: ["$storageCapacity", 0] },
            { $multiply: [{ $divide: ["$currentUtilization", "$storageCapacity"] }, 100] },
            0,
          ],
        },
      },
    },
  );

  return pipeline;
};
