import type { PipelineStage } from "mongoose";

export const buildRecommendationAnalyticsPipeline = (): PipelineStage[] => [
  {
    $group: {
      _id: null,
      pending: {
        $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
      },
      approved: {
        $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
      },
      rejected: {
        $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
      },
      expired: {
        $sum: { $cond: [{ $eq: ["$status", "EXPIRED"] }, 1, 0] },
      },
      total: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      pending: 1,
      approved: 1,
      rejected: 1,
      expired: 1,
      total: 1,
    },
  },
];

export const buildRecommendationTypeDistributionPipeline = (): PipelineStage[] => [
  {
    $group: {
      _id: null,
      REORDER: {
        $sum: { $cond: [{ $eq: ["$recommendationType", "REORDER"] }, 1, 0] },
      },
      RETURN_TO_WAREHOUSE: {
        $sum: { $cond: [{ $eq: ["$recommendationType", "RETURN_TO_WAREHOUSE"] }, 1, 0] },
      },
      DO_NOT_REORDER: {
        $sum: { $cond: [{ $in: ["$recommendationType", ["DONT_REORDER", "DO_NOT_REORDER"]] }, 1, 0] },
      },
      NO_ACTION: {
        $sum: { $cond: [{ $eq: ["$recommendationType", "NO_ACTION"] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      REORDER: 1,
      RETURN_TO_WAREHOUSE: 1,
      DO_NOT_REORDER: 1,
      NO_ACTION: 1,
    },
  },
];

export const buildRecommendationTrendPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      generatedAt: { $gte: since },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$generatedAt" } },
      recommendations: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      day: "$_id",
      recommendations: 1,
    },
  },
  {
    $sort: { day: 1 },
  },
];

export const buildRecommendationConfidenceDistributionPipeline = (): PipelineStage[] => [
  {
    $project: {
      confidenceBucket: {
        $switch: {
          branches: [
            { case: { $gte: ["$overallScore", 0.8] }, then: "HIGH" },
            { case: { $gte: ["$overallScore", 0.5] }, then: "MEDIUM" },
          ],
          default: "LOW",
        },
      },
    },
  },
  {
    $group: {
      _id: "$confidenceBucket",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      bucket: "$_id",
      count: 1,
    },
  },
];
