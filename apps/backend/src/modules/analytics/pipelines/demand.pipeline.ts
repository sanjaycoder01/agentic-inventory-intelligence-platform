import type { PipelineStage } from "mongoose";

export const buildDemandAnalyticsPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      eventTimestamp: { $gte: since },
      eventType: { $in: ["ADD_TO_CART", "REMOVE_FROM_CART"] },
    },
  },
  {
    $group: {
      _id: "$productId",
      totalAdds: {
        $sum: { $cond: [{ $eq: ["$eventType", "ADD_TO_CART"] }, "$quantity", 0] },
      },
      totalRemoves: {
        $sum: { $cond: [{ $eq: ["$eventType", "REMOVE_FROM_CART"] }, "$quantity", 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      totalAdds: 1,
      totalRemoves: 1,
      netDemand: { $max: [0, { $subtract: ["$totalAdds", "$totalRemoves"] }] },
      demandScore: { $max: [0, { $subtract: ["$totalAdds", "$totalRemoves"] }] },
    },
  },
  {
    $sort: { netDemand: -1 },
  },
];

export const buildTrendingProductsPipeline = (since: Date, limit: number): PipelineStage[] => [
  {
    $match: {
      eventTimestamp: { $gte: since },
      eventType: { $in: ["ADD_TO_CART", "REMOVE_FROM_CART"] },
    },
  },
  {
    $group: {
      _id: "$productId",
      totalAdds: {
        $sum: { $cond: [{ $eq: ["$eventType", "ADD_TO_CART"] }, "$quantity", 0] },
      },
      totalRemoves: {
        $sum: { $cond: [{ $eq: ["$eventType", "REMOVE_FROM_CART"] }, "$quantity", 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      netDemand: { $max: [0, { $subtract: ["$totalAdds", "$totalRemoves"] }] },
    },
  },
  {
    $sort: { netDemand: -1 },
  },
  {
    $limit: limit,
  },
];

export const buildHourlyDemandPipeline = (productId: any, since: Date): PipelineStage[] => [
  {
    $match: {
      productId: productId,
      eventTimestamp: { $gte: since },
      eventType: { $in: ["ADD_TO_CART", "REMOVE_FROM_CART"] },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%H", date: "$eventTimestamp" } },
      adds: {
        $sum: { $cond: [{ $eq: ["$eventType", "ADD_TO_CART"] }, "$quantity", 0] },
      },
      removes: {
        $sum: { $cond: [{ $eq: ["$eventType", "REMOVE_FROM_CART"] }, "$quantity", 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      hour: "$_id",
      adds: 1,
      removes: 1,
      netDemand: { $subtract: ["$adds", "$removes"] },
    },
  },
  {
    $sort: { hour: 1 },
  },
];

export const buildDailyDemandPipeline = (productId: any, since: Date): PipelineStage[] => [
  {
    $match: {
      productId: productId,
      eventTimestamp: { $gte: since },
      eventType: { $in: ["ADD_TO_CART", "REMOVE_FROM_CART"] },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$eventTimestamp" } },
      adds: {
        $sum: { $cond: [{ $eq: ["$eventType", "ADD_TO_CART"] }, "$quantity", 0] },
      },
      removes: {
        $sum: { $cond: [{ $eq: ["$eventType", "REMOVE_FROM_CART"] }, "$quantity", 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      date: "$_id",
      netDemand: { $subtract: ["$adds", "$removes"] },
    },
  },
  {
    $sort: { date: 1 },
  },
];
