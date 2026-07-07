import type { PipelineStage } from "mongoose";

export const buildDarkStoreDashboardPipeline = (darkStoreId?: any): PipelineStage[] => {
  const pipeline: PipelineStage[] = [];

  if (darkStoreId) {
    pipeline.push({
      $match: { _id: darkStoreId },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "darkStoreProducts",
        localField: "_id",
        foreignField: "darkStoreId",
        as: "inventory",
      },
    },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "darkStoreId",
        as: "orders",
      },
    },
    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "darkStoreId",
        as: "ratings",
      },
    },
    {
      $lookup: {
        from: "recommendations",
        localField: "_id",
        foreignField: "darkStoreId",
        as: "recommendations",
      },
    },
    {
      $project: {
        _id: 0,
        darkStoreId: { $toString: "$_id" },
        totalProducts: { $size: "$inventory" },
        availableInventory: { $sum: "$inventory.availableQuantity" },
        reservedInventory: { $sum: "$inventory.reservedQuantity" },
        totalOrders: { $size: "$orders" },
        completedOrders: {
          $size: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: { $eq: ["$$order.orderStatus", "DELIVERED"] },
            },
          },
        },
        averageRating: { $avg: "$ratings.rating" },
        pendingRecommendations: {
          $size: {
            $filter: {
              input: "$recommendations",
              as: "rec",
              cond: { $eq: ["$$rec.status", "PENDING"] },
            },
          },
        },
        approvedRecommendations: {
          $size: {
            $filter: {
              input: "$recommendations",
              as: "rec",
              cond: { $eq: ["$$rec.status", "APPROVED"] },
            },
          },
        },
      },
    },
  );

  return pipeline;
};
