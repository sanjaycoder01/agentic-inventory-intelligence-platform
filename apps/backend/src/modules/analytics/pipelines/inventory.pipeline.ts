import type { PipelineStage } from "mongoose";
import { OVERSTOCK_MULTIPLIER } from "../analytics.constants.js";

export const buildInventoryHealthPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product",
    },
  },
  {
    $unwind: "$product",
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$productId" },
      darkStoreId: { $toString: "$darkStoreId" },
      availableQuantity: 1,
      reservedQuantity: 1,
      reorderLevel: "$product.reorderThreshold",
    },
  },
  {
    $addFields: {
      healthStatus: {
        $switch: {
          branches: [
            { case: { $eq: ["$availableQuantity", 0] }, then: "OUT_OF_STOCK" },
            { case: { $lte: ["$availableQuantity", "$reorderLevel"] }, then: "LOW_STOCK" },
            { case: { $gt: ["$availableQuantity", { $multiply: ["$reorderLevel", OVERSTOCK_MULTIPLIER] }] }, then: "OVERSTOCK" },
          ],
          default: "HEALTHY",
        },
      },
    },
  },
];

export const buildLowStockProductsPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product",
    },
  },
  {
    $unwind: "$product",
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$productId" },
      darkStoreId: { $toString: "$darkStoreId" },
      availableQuantity: 1,
      reservedQuantity: 1,
      reorderLevel: "$product.reorderThreshold",
    },
  },
  {
    $match: {
      $expr: { $lte: ["$availableQuantity", "$reorderLevel"] },
      availableQuantity: { $gt: 0 },
    },
  },
  {
    $sort: { availableQuantity: 1 },
  },
];

export const buildOutOfStockProductsPipeline = (): PipelineStage[] => [
  {
    $match: {
      availableQuantity: 0,
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$productId" },
      darkStoreId: { $toString: "$darkStoreId" },
      availableQuantity: 1,
      reservedQuantity: 1,
    },
  },
];

export const buildOverStockProductsPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product",
    },
  },
  {
    $unwind: "$product",
  },
  {
    $project: {
      _id: 0,
      productId: { $toString: "$productId" },
      darkStoreId: { $toString: "$darkStoreId" },
      availableQuantity: 1,
      reservedQuantity: 1,
      reorderLevel: "$product.reorderThreshold",
    },
  },
  {
    $match: {
      $expr: { $gt: ["$availableQuantity", { $multiply: ["$reorderLevel", OVERSTOCK_MULTIPLIER] }] },
    },
  },
  {
    $sort: { availableQuantity: -1 },
  },
];

export const buildInventorySummaryPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product",
    },
  },
  {
    $unwind: "$product",
  },
  {
    $group: {
      _id: null,
      totalProducts: { $sum: 1 },
      totalAvailable: { $sum: "$availableQuantity" },
      totalReserved: { $sum: "$reservedQuantity" },
      lowStockCount: {
        $sum: {
          $cond: [
            {
              $and: [
                { $lte: ["$availableQuantity", "$product.reorderThreshold"] },
                { $gt: ["$availableQuantity", 0] },
              ],
            },
            1,
            0,
          ],
        },
      },
      outOfStockCount: {
        $sum: { $cond: [{ $eq: ["$availableQuantity", 0] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      totalProducts: 1,
      totalAvailable: 1,
      totalReserved: 1,
      lowStockCount: 1,
      outOfStockCount: 1,
    },
  },
];
