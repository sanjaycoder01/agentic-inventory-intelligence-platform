import { Types } from "mongoose";
import { CartEventModel } from "../demand/demand.model.js";
import { OrderModel } from "../orders/order.model.js";
import { RatingModel } from "../ratings/rating.model.js";
import { DarkStoreProductModel } from "../dark-store/dark-store-product.model.js";
import { RecommendationModel } from "../intelligence/recommendation.model.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";
import { WarehouseModel } from "../warehouse/warehouse.model.js";
import { DEMAND_WINDOW_HOURS } from "./analytics.constants.js";
import type {
  DemandAnalyticsDTO,
  TrendingProductDTO,
  HourlyDemandDTO,
  DailyDemandDTO,
  OrderAnalyticsDTO,
  TopSellingProductDTO,
  ConversionAnalyticsDTO,
  RevenueAnalyticsDTO,
  RatingAnalyticsDTO,
  TopRatedProductDTO,
  RatingDistributionDTO,
  RatingTrendDTO,
  InventoryHealthDTO,
  LowStockProductDTO,
  OutOfStockProductDTO,
  OverStockProductDTO,
  InventorySummaryDTO,
  RecommendationAnalyticsDTO,
  RecommendationTypeDTO,
  RecommendationTrendDTO,
  RecommendationConfidenceDTO,
  DarkStoreDashboardDTO,
  WarehouseDashboardDTO,
  ExecutiveDashboardDTO,
} from "./analytics.types.js";
import {
  buildDemandAnalyticsPipeline,
  buildTrendingProductsPipeline,
  buildHourlyDemandPipeline,
  buildDailyDemandPipeline,
} from "./pipelines/demand.pipeline.js";
import {
  buildOrderAnalyticsPipeline,
  buildTopSellingProductsPipeline,
  buildConversionAnalyticsPipeline,
  buildRevenueAnalyticsPipeline,
} from "./pipelines/orders.pipeline.js";
import {
  buildRatingAnalyticsPipeline,
  buildTopRatedProductsPipeline,
  buildRatingDistributionPipeline,
  buildRatingTrendPipeline,
} from "./pipelines/ratings.pipeline.js";
import {
  buildInventoryHealthPipeline,
  buildLowStockProductsPipeline,
  buildOutOfStockProductsPipeline,
  buildOverStockProductsPipeline,
  buildInventorySummaryPipeline,
} from "./pipelines/inventory.pipeline.js";
import {
  buildRecommendationAnalyticsPipeline,
  buildRecommendationTypeDistributionPipeline,
  buildRecommendationTrendPipeline,
  buildRecommendationConfidenceDistributionPipeline,
} from "./pipelines/recommendation.pipeline.js";
import {
  buildDarkStoreDashboardPipeline,
} from "./pipelines/dark-store-dashboard.pipeline.js";
import {
  buildWarehouseDashboardPipeline,
} from "./pipelines/warehouse-dashboard.pipeline.js";
import {
  buildExecutiveDashboardPipeline,
} from "./pipelines/executive-dashboard.pipeline.js";

export class AnalyticsService {
  private getDemandWindowStart(hours = DEMAND_WINDOW_HOURS) {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    return since;
  }

  async getDemandAnalytics(filters?: any): Promise<DemandAnalyticsDTO[]> {
    const since = this.getDemandWindowStart();
    return CartEventModel.aggregate(buildDemandAnalyticsPipeline(since));
  }

  async getTrendingProducts(limit = 10): Promise<TrendingProductDTO[]> {
    const since = this.getDemandWindowStart();
    return CartEventModel.aggregate(buildTrendingProductsPipeline(since, limit));
  }

  async getHourlyDemand(productId: string): Promise<HourlyDemandDTO[]> {
    const since = this.getDemandWindowStart(24);
    return CartEventModel.aggregate(
      buildHourlyDemandPipeline(new Types.ObjectId(productId), since)
    );
  }

  async getDailyDemand(productId: string): Promise<DailyDemandDTO[]> {
    const since = this.getDemandWindowStart(30 * 24); // Last 30 days
    return CartEventModel.aggregate(
      buildDailyDemandPipeline(new Types.ObjectId(productId), since)
    );
  }

  async getOrderAnalytics(): Promise<OrderAnalyticsDTO[]> {
    const since = this.getDemandWindowStart();
    return OrderModel.aggregate(buildOrderAnalyticsPipeline(since));
  }

  async getTopSellingProducts(limit = 10): Promise<TopSellingProductDTO[]> {
    const since = this.getDemandWindowStart();
    return OrderModel.aggregate(buildTopSellingProductsPipeline(since, limit));
  }

  async getConversionAnalytics(): Promise<ConversionAnalyticsDTO[]> {
    const since = this.getDemandWindowStart();
    const [demandData, orderData] = await Promise.all([
      CartEventModel.aggregate(buildDemandAnalyticsPipeline(since)),
      OrderModel.aggregate(buildConversionAnalyticsPipeline(since)),
    ]);

    const orderMap = new Map<string, number>();
    for (const item of orderData) {
      orderMap.set(item.productId, item.completedOrders);
    }

    return demandData.map((demandItem) => {
      const completedOrders = orderMap.get(demandItem.productId) || 0;
      const conversionRate =
        demandItem.netDemand > 0 ? completedOrders / demandItem.netDemand : 0;
      return {
        productId: demandItem.productId,
        completedOrders,
        netDemand: demandItem.netDemand,
        conversionRate,
      };
    });
  }

  async getRevenueAnalytics(): Promise<RevenueAnalyticsDTO[]> {
    const since = this.getDemandWindowStart();
    return OrderModel.aggregate(buildRevenueAnalyticsPipeline(since));
  }

  async getRatingAnalytics(): Promise<RatingAnalyticsDTO[]> {
    const since = this.getDemandWindowStart();
    return RatingModel.aggregate(buildRatingAnalyticsPipeline(since));
  }

  async getTopRatedProducts(limit = 10): Promise<TopRatedProductDTO[]> {
    const since = this.getDemandWindowStart();
    return RatingModel.aggregate(buildTopRatedProductsPipeline(since, limit));
  }

  async getRatingDistribution(): Promise<RatingDistributionDTO> {
    const since = this.getDemandWindowStart();
    const result = await RatingModel.aggregate(buildRatingDistributionPipeline(since));
    return result[0] || {
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0,
    };
  }

  async getRatingTrend(): Promise<RatingTrendDTO[]> {
    const since = this.getDemandWindowStart(30 * 24); // Last 30 days
    return RatingModel.aggregate(buildRatingTrendPipeline(since));
  }

  async getInventoryHealth(): Promise<InventoryHealthDTO[]> {
    return DarkStoreProductModel.aggregate(buildInventoryHealthPipeline());
  }

  async getLowStockProducts(): Promise<LowStockProductDTO[]> {
    return DarkStoreProductModel.aggregate(buildLowStockProductsPipeline());
  }

  async getOutOfStockProducts(): Promise<OutOfStockProductDTO[]> {
    return DarkStoreProductModel.aggregate(buildOutOfStockProductsPipeline());
  }

  async getOverStockProducts(): Promise<OverStockProductDTO[]> {
    return DarkStoreProductModel.aggregate(buildOverStockProductsPipeline());
  }

  async getInventorySummary(): Promise<InventorySummaryDTO> {
    const result = await DarkStoreProductModel.aggregate(buildInventorySummaryPipeline());
    return result[0] || {
      totalProducts: 0,
      totalAvailable: 0,
      totalReserved: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }

  async getRecommendationAnalytics(): Promise<RecommendationAnalyticsDTO> {
    const result = await RecommendationModel.aggregate(buildRecommendationAnalyticsPipeline());
    return result[0] || {
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      total: 0,
    };
  }

  async getRecommendationStatus(): Promise<RecommendationAnalyticsDTO> {
    return this.getRecommendationAnalytics(); // Same as analytics, status typically summarizes
  }

  async getRecommendationDistribution(): Promise<RecommendationTypeDTO> {
    const result = await RecommendationModel.aggregate(buildRecommendationTypeDistributionPipeline());
    return result[0] || {
      REORDER: 0,
      RETURN_TO_WAREHOUSE: 0,
      DO_NOT_REORDER: 0,
      NO_ACTION: 0,
    };
  }

  async getRecommendationTrend(): Promise<RecommendationTrendDTO[]> {
    const since = this.getDemandWindowStart(30 * 24); // Last 30 days
    return RecommendationModel.aggregate(buildRecommendationTrendPipeline(since));
  }

  async getDarkStoreDashboard(): Promise<DarkStoreDashboardDTO[]> {
    return DarkStoreModel.aggregate(buildDarkStoreDashboardPipeline());
  }

  async getDarkStoreDashboardById(darkStoreId: string): Promise<DarkStoreDashboardDTO> {
    const result = await DarkStoreModel.aggregate(
      buildDarkStoreDashboardPipeline(new Types.ObjectId(darkStoreId))
    );
    return result[0] || null;
  }

  async getWarehouseDashboard(): Promise<WarehouseDashboardDTO[]> {
    return WarehouseModel.aggregate(buildWarehouseDashboardPipeline());
  }

  async getWarehouseDashboardById(warehouseId: string): Promise<WarehouseDashboardDTO> {
    const result = await WarehouseModel.aggregate(
      buildWarehouseDashboardPipeline(new Types.ObjectId(warehouseId))
    );
    return result[0] || null;
  }

  async getExecutiveDashboard(): Promise<ExecutiveDashboardDTO> {
    const since = this.getDemandWindowStart();
    const result = await CartEventModel.aggregate(buildExecutiveDashboardPipeline(since));
    return result[0] || null;
  }
}

export const analyticsService = new AnalyticsService();
