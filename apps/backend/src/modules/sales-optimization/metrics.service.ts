import { Types } from "mongoose";
import { COMPLETED_ORDER_STATUSES, OrderModel } from "../orders/order.model.js";
import { CartEventModel } from "../demand/demand.model.js";
import { DarkStoreProductModel } from "../dark-store/dark-store-product.model.js";
import { StockLedgerModel } from "../inventory/stock-ledger.model.js";
import { WarehouseProductModel } from "../warehouse/warehouse-product.model.js";
import { SALES_OPT_WINDOW_DAYS } from "./sales-optimization.constants.js";
import {
  calculateAverageDailySales,
  calculateDaysOfCover,
  calculateDeadStockScore,
  calculateDemandTrend,
  calculateSellThroughPercent,
  classifyInventoryAgeBand,
  classifyVelocity,
  daysBetween,
} from "./metrics.calculations.js";
import type { ProductSalesMetrics } from "./sales-optimization.types.js";

export class SalesMetricsService {
  async computeForProduct(
    productId: string,
    darkStoreId: string,
    windowDays = SALES_OPT_WINDOW_DAYS,
  ): Promise<ProductSalesMetrics> {
    const since = new Date();
    since.setDate(since.getDate() - windowDays);
    const mid = new Date();
    mid.setDate(mid.getDate() - Math.floor(windowDays / 2));

    const productOid = new Types.ObjectId(productId);
    const storeOid = new Types.ObjectId(darkStoreId);

    const [
      soldAgg,
      recentSoldAgg,
      priorSoldAgg,
      lastSale,
      cartAdds,
      receivedAgg,
      inventory,
      warehouseAgg,
    ] = await Promise.all([
      OrderModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: productOid,
            darkStoreId: storeOid,
            orderStatus: { $in: [...COMPLETED_ORDER_STATUSES] },
            orderedAt: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      OrderModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: productOid,
            darkStoreId: storeOid,
            orderStatus: { $in: [...COMPLETED_ORDER_STATUSES] },
            orderedAt: { $gte: mid },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      OrderModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: productOid,
            darkStoreId: storeOid,
            orderStatus: { $in: [...COMPLETED_ORDER_STATUSES] },
            orderedAt: { $gte: since, $lt: mid },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      OrderModel.findOne({
        productId: productOid,
        darkStoreId: storeOid,
        orderStatus: { $in: [...COMPLETED_ORDER_STATUSES] },
      })
        .sort({ orderedAt: -1 })
        .select("orderedAt")
        .lean(),
      CartEventModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: productOid,
            darkStoreId: storeOid,
            eventType: "ADD_TO_CART",
            eventTimestamp: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$quantity" } } },
      ]),
      StockLedgerModel.aggregate<{ total: number }>([
        {
          $match: {
            productId: productOid,
            darkStoreId: storeOid,
            reason: "RESTOCK",
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: null, total: { $sum: "$change" } } },
      ]),
      DarkStoreProductModel.findOne({ productId, darkStoreId }).lean(),
      WarehouseProductModel.aggregate<{ total: number }>([
        { $match: { productId: productOid } },
        { $group: { _id: null, total: { $sum: "$availableQuantity" } } },
      ]),
    ]);

    const unitsSold = soldAgg[0]?.total ?? 0;
    const recentHalf = recentSoldAgg[0]?.total ?? 0;
    const priorHalf = priorSoldAgg[0]?.total ?? 0;
    const cartAddCount = cartAdds[0]?.total ?? 0;
    const currentInventory = inventory?.availableQuantity ?? 0;
    const ledgerReceived = Math.max(0, receivedAgg[0]?.total ?? 0);
    // Units received = restocks in window + current stock (proxy when no ledger history)
    const unitsReceived = Math.max(
      ledgerReceived + currentInventory,
      unitsSold + currentInventory,
      1,
    );
    const warehouseInventory = warehouseAgg[0]?.total ?? 0;

    const sellThroughPercent = calculateSellThroughPercent(
      unitsSold,
      unitsReceived,
    );
    const averageDailySales = calculateAverageDailySales(unitsSold, windowDays);
    const inventoryAgeDays = inventory?.lastTransferredAt
      ? daysBetween(new Date(inventory.lastTransferredAt))
      : inventory?.createdAt
        ? daysBetween(new Date(inventory.createdAt))
        : windowDays;
    const daysSinceLastSale = lastSale?.orderedAt
      ? daysBetween(new Date(lastSale.orderedAt))
      : null;
    const conversionRate =
      cartAddCount <= 0 ? 0 : Math.min(1, unitsSold / cartAddCount);
    const averageRating = inventory?.averageRating ?? 0;
    const ratingScore = averageRating / 5;
    const demandTrend = calculateDemandTrend(recentHalf, priorHalf);
    const velocityClass = classifyVelocity(averageDailySales);
    const deadStockScore = calculateDeadStockScore({
      sellThroughPercent,
      inventoryAgeDays,
      averageDailySales,
    });

    return {
      productId,
      darkStoreId,
      unitsSold,
      unitsReceived,
      sellThroughPercent: Math.round(sellThroughPercent * 100) / 100,
      inventoryAgeDays,
      inventoryAgeBand: classifyInventoryAgeBand(inventoryAgeDays),
      daysSinceLastSale,
      averageDailySales: Math.round(averageDailySales * 100) / 100,
      cartAdds: cartAddCount,
      conversionRate: Math.round(conversionRate * 1000) / 1000,
      averageRating,
      ratingScore: Math.round(ratingScore * 100) / 100,
      currentInventory,
      warehouseInventory,
      daysOfCover: calculateDaysOfCover(currentInventory, averageDailySales),
      demandTrend: Math.round(demandTrend * 100) / 100,
      velocity: averageDailySales,
      velocityClass,
      deadStockScore,
      windowDays,
    };
  }
}

export const salesMetricsService = new SalesMetricsService();
