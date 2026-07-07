import type { PipelineStage } from "mongoose";

export const buildOrderAnalyticsPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      orderedAt: { $gte: since },
    },
  },
  {
    $group: {
      _id: "$productId",
      totalOrders: { $sum: 1 },
      completedOrders: {
        $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] },
      },
      cancelledOrders: {
        $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] },
      },
      totalQuantitySold: {
        $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, "$quantity", 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      totalOrders: 1,
      completedOrders: 1,
      cancelledOrders: 1,
      totalQuantitySold: 1,
    },
  },
  {
    $sort: { totalOrders: -1 },
  },
];

export const buildTopSellingProductsPipeline = (since: Date, limit: number): PipelineStage[] => [
  {
    $match: {
      orderedAt: { $gte: since },
      orderStatus: "DELIVERED",
    },
  },
  {
    $group: {
      _id: "$productId",
      quantitySold: { $sum: "$quantity" },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      quantitySold: 1,
    },
  },
  {
    $sort: { quantitySold: -1 },
  },
  {
    $limit: limit,
  },
];

export const buildConversionAnalyticsPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      orderedAt: { $gte: since },
      orderStatus: "DELIVERED",
    },
  },
  {
    $group: {
      _id: "$productId",
      completedOrders: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      completedOrders: 1,
    },
  },
];

export const buildRevenueAnalyticsPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      orderedAt: { $gte: since },
      orderStatus: "DELIVERED",
    },
  },
  {
    $group: {
      _id: "$productId",
      quantitySold: { $sum: "$quantity" },
      revenue: {
        $sum: { $multiply: ["$quantity", "$sellingPrice"] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      quantitySold: 1,
      revenue: 1,
    },
  },
  {
    $sort: { revenue: -1 },
  },
];
