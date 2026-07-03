import { demandService } from "../demand/demand.service.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { orderService } from "../orders/order.service.js";
import { ratingService } from "../ratings/rating.service.js";
import { warehouseFulfillmentService } from "../warehouse/warehouse-fulfillment.service.js";
import type {
  ProductSignals,
  SignalAggregatorDependencies,
} from "./signal-aggregator.types.js";

export class SignalAggregatorService {
  constructor(
    private readonly dependencies: SignalAggregatorDependencies = {
      demandService,
      orderService,
      ratingService,
      inventoryService,
      warehouseService: warehouseFulfillmentService,
    },
  ) {}

  async aggregateSignals(
    productId: string,
    darkStoreId: string,
  ): Promise<ProductSignals> {
    const [
      demandScore,
      conversion,
      rating,
      inventory,
      warehouseStock,
    ] = await Promise.all([
      this.dependencies.demandService.getDemandScore(productId),
      this.dependencies.orderService.getConversionScore(productId),
      this.dependencies.ratingService.getRatingScore(productId),
      this.dependencies.inventoryService.getInventoryByProduct(
        darkStoreId,
        productId,
      ),
      this.getWarehouseStock(productId),
    ]);

    return {
      productId,
      darkStoreId,
      demandScore,
      conversionScore: conversion.conversionScore,
      ratingScore: rating.ratingScore,
      availableQuantity: inventory.availableQuantity,
      reservedQuantity: inventory.reservedQuantity,
      warehouseStock,
      averageRating: rating.averageRating,
      totalRatings: rating.totalRatings,
    };
  }

  private async getWarehouseStock(productId: string): Promise<number> {
    const stockSummary = await this.dependencies.warehouseService.getStockSummary();

    return stockSummary
      .filter((item) => item.productId.toString() === productId)
      .reduce((total, item) => total + item.availableQuantity, 0);
  }
}

export const signalAggregatorService = new SignalAggregatorService();
