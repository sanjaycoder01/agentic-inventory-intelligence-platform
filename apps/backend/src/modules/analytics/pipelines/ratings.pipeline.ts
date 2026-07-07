import type { PipelineStage } from "mongoose";

export const buildRatingAnalyticsPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      ratedAt: { $gte: since },
    },
  },
  {
    $group: {
      _id: "$productId",
      averageRating: { $avg: "$rating" },
      totalRatings: { $sum: 1 },
      fiveStar: {
        $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
      },
      fourStar: {
        $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
      },
      threeStar: {
        $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
      },
      twoStar: {
        $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
      },
      oneStar: {
        $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      averageRating: 1,
      totalRatings: 1,
      fiveStar: 1,
      fourStar: 1,
      threeStar: 1,
      twoStar: 1,
      oneStar: 1,
    },
  },
  {
    $sort: { averageRating: -1, totalRatings: -1 },
  },
];

export const buildTopRatedProductsPipeline = (since: Date, limit: number): PipelineStage[] => [
  {
    $match: {
      ratedAt: { $gte: since },
    },
  },
  {
    $group: {
      _id: "$productId",
      averageRating: { $avg: "$rating" },
      totalRatings: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$_id" },
      averageRating: 1,
      totalRatings: 1,
    },
  },
  {
    $sort: { averageRating: -1, totalRatings: -1 },
  },
  {
    $limit: limit,
  },
];

export const buildRatingDistributionPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      ratedAt: { $gte: since },
    },
  },
  {
    $group: {
      _id: null,
      fiveStar: {
        $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
      },
      fourStar: {
        $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
      },
      threeStar: {
        $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
      },
      twoStar: {
        $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
      },
      oneStar: {
        $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      fiveStar: 1,
      fourStar: 1,
      threeStar: 1,
      twoStar: 1,
      oneStar: 1,
    },
  },
];

export const buildRatingTrendPipeline = (since: Date): PipelineStage[] => [
  {
    $match: {
      ratedAt: { $gte: since },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$ratedAt" } },
      averageRating: { $avg: "$rating" },
    },
  },
  {
    $project: {
      _id: 0,
      day: "$_id",
      averageRating: 1,
    },
  },
  {
    $sort: { day: 1 },
  },
];
