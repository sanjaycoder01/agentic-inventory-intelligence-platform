import type { PipelineStage } from "mongoose";
import { buildTrendingProductsPipeline } from "./demand.pipeline.js";
import { OVERSTOCK_MULTIPLIER } from "../analytics.constants.js";

export const buildExecutiveDashboardPipeline = (since: Date): PipelineStage[] => {
  return [
    { $limit: 1 }, // Ensure only one document flows through the facet
    { $project: { _id: 0 } },
    {
      $facet: {
        demand: [
          {
            $lookup: {
              from: "cartEvents",
              pipeline: [
                { $match: { eventTimestamp: { $gte: since } } },
                {
                  $group: {
                    _id: null,
                    totalCartAdds: { $sum: { $cond: [{ $eq: ["$eventType", "ADD_TO_CART"] }, 1, 0] } },
                    totalCartRemoves: { $sum: { $cond: [{ $eq: ["$eventType", "REMOVE_FROM_CART"] }, 1, 0] } },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $lookup: {
              from: "cartEvents",
              pipeline: buildTrendingProductsPipeline(since, 5) as any[],
              as: "trendingProducts",
            },
          },
          {
            $project: {
              totalCartAdds: { $ifNull: [{ $arrayElemAt: ["$summary.totalCartAdds", 0] }, 0] },
              totalCartRemoves: { $ifNull: [{ $arrayElemAt: ["$summary.totalCartRemoves", 0] }, 0] },
              trendingProducts: 1,
            },
          },
        ],
        orders: [
          {
            $lookup: {
              from: "orders",
              pipeline: [
                { $match: { orderedAt: { $gte: since } } },
                {
                  $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    completedOrders: { $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] } },
                    cancelledOrders: { $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] } },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $project: {
              totalOrders: { $ifNull: [{ $arrayElemAt: ["$summary.totalOrders", 0] }, 0] },
              completedOrders: { $ifNull: [{ $arrayElemAt: ["$summary.completedOrders", 0] }, 0] },
              cancelledOrders: { $ifNull: [{ $arrayElemAt: ["$summary.cancelledOrders", 0] }, 0] },
            },
          },
          {
            $addFields: {
              conversionRate: {
                $cond: [
                  { $gt: ["$totalOrders", 0] },
                  { $divide: ["$completedOrders", "$totalOrders"] },
                  0,
                ],
              },
            },
          },
        ],
        ratings: [
          {
            $lookup: {
              from: "ratings",
              pipeline: [
                { $match: { ratedAt: { $gte: since } } },
                {
                  $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 },
                    oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                    twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                    threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                    fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                    fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $project: {
              averageRating: { $ifNull: [{ $arrayElemAt: ["$summary.averageRating", 0] }, 0] },
              totalRatings: { $ifNull: [{ $arrayElemAt: ["$summary.totalRatings", 0] }, 0] },
              ratingDistribution: {
                oneStar: { $ifNull: [{ $arrayElemAt: ["$summary.oneStar", 0] }, 0] },
                twoStar: { $ifNull: [{ $arrayElemAt: ["$summary.twoStar", 0] }, 0] },
                threeStar: { $ifNull: [{ $arrayElemAt: ["$summary.threeStar", 0] }, 0] },
                fourStar: { $ifNull: [{ $arrayElemAt: ["$summary.fourStar", 0] }, 0] },
                fiveStar: { $ifNull: [{ $arrayElemAt: ["$summary.fiveStar", 0] }, 0] },
              },
            },
          },
        ],
        inventory: [
          {
            $lookup: {
              from: "darkStoreProducts",
              pipeline: [
                {
                  $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product",
                  },
                },
                { $unwind: "$product" },
                {
                  $project: {
                    availableQuantity: 1,
                    reorderLevel: "$product.reorderThreshold",
                  },
                },
                {
                  $group: {
                    _id: null,
                    lowStock: {
                      $sum: {
                        $cond: [
                          {
                            $and: [
                              { $lte: ["$availableQuantity", "$reorderLevel"] },
                              { $gt: ["$availableQuantity", 0] },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    outOfStock: {
                      $sum: { $cond: [{ $eq: ["$availableQuantity", 0] }, 1, 0] },
                    },
                    overStock: {
                      $sum: {
                        $cond: [
                          { $gt: ["$availableQuantity", { $multiply: ["$reorderLevel", OVERSTOCK_MULTIPLIER] }] },
                          1,
                          0,
                        ],
                      },
                    },
                    totalItems: { $sum: 1 },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $project: {
              lowStock: { $ifNull: [{ $arrayElemAt: ["$summary.lowStock", 0] }, 0] },
              outOfStock: { $ifNull: [{ $arrayElemAt: ["$summary.outOfStock", 0] }, 0] },
              overStock: { $ifNull: [{ $arrayElemAt: ["$summary.overStock", 0] }, 0] },
              inventoryHealth: {
                $cond: [
                  { $gt: [{ $arrayElemAt: ["$summary.totalItems", 0] }, 0] },
                  {
                    $subtract: [
                      1,
                      {
                        $divide: [
                          { $add: [{ $arrayElemAt: ["$summary.lowStock", 0] }, { $arrayElemAt: ["$summary.outOfStock", 0] }] },
                          { $arrayElemAt: ["$summary.totalItems", 0] },
                        ],
                      },
                    ],
                  },
                  1,
                ],
              },
            },
          },
        ],
        recommendations: [
          {
            $lookup: {
              from: "recommendations",
              pipeline: [
                { $match: { generatedAt: { $gte: since } } },
                {
                  $group: {
                    _id: null,
                    pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
                    approved: { $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] } },
                    reorder: { $sum: { $cond: [{ $eq: ["$recommendationType", "REORDER"] }, 1, 0] } },
                    returnToWarehouse: { $sum: { $cond: [{ $eq: ["$recommendationType", "RETURN_TO_WAREHOUSE"] }, 1, 0] } },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $project: {
              pending: { $ifNull: [{ $arrayElemAt: ["$summary.pending", 0] }, 0] },
              approved: { $ifNull: [{ $arrayElemAt: ["$summary.approved", 0] }, 0] },
              rejected: { $ifNull: [{ $arrayElemAt: ["$summary.rejected", 0] }, 0] },
              reorder: { $ifNull: [{ $arrayElemAt: ["$summary.reorder", 0] }, 0] },
              returnToWarehouse: { $ifNull: [{ $arrayElemAt: ["$summary.returnToWarehouse", 0] }, 0] },
            },
          },
        ],
        purchaseOrders: [
          {
            $lookup: {
              from: "purchaseOrders",
              pipeline: [
                { $match: { createdAt: { $gte: since } } },
                {
                  $group: {
                    _id: null,
                    draft: { $sum: { $cond: [{ $eq: ["$status", "DRAFT"] }, 1, 0] } },
                    pendingApproval: { $sum: { $cond: [{ $eq: ["$status", "PENDING_APPROVAL"] }, 1, 0] } },
                    approved: { $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $project: {
              draft: { $ifNull: [{ $arrayElemAt: ["$summary.draft", 0] }, 0] },
              pendingApproval: { $ifNull: [{ $arrayElemAt: ["$summary.pendingApproval", 0] }, 0] },
              approved: { $ifNull: [{ $arrayElemAt: ["$summary.approved", 0] }, 0] },
              completed: { $ifNull: [{ $arrayElemAt: ["$summary.completed", 0] }, 0] },
            },
          },
        ],
        notifications: [
          {
            $lookup: {
              from: "notifications",
              pipeline: [
                { $match: { createdAt: { $gte: since } } },
                {
                  $group: {
                    _id: null,
                    pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
                    sent: { $sum: { $cond: [{ $eq: ["$status", "SENT"] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
                  },
                },
              ],
              as: "summary",
            },
          },
          {
            $project: {
              pending: { $ifNull: [{ $arrayElemAt: ["$summary.pending", 0] }, 0] },
              sent: { $ifNull: [{ $arrayElemAt: ["$summary.sent", 0] }, 0] },
              failed: { $ifNull: [{ $arrayElemAt: ["$summary.failed", 0] }, 0] },
            },
          },
        ],
      },
    },
    {
      $project: {
        generatedAt: { $literal: new Date() },
        demand: { $arrayElemAt: ["$demand", 0] },
        orders: { $arrayElemAt: ["$orders", 0] },
        ratings: { $arrayElemAt: ["$ratings", 0] },
        inventory: { $arrayElemAt: ["$inventory", 0] },
        recommendations: { $arrayElemAt: ["$recommendations", 0] },
        purchaseOrders: { $arrayElemAt: ["$purchaseOrders", 0] },
        notifications: { $arrayElemAt: ["$notifications", 0] },
      },
    },
  ];
};
