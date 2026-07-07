import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { AnalyticsService } from "./analytics.service.js";
import { CartEventModel } from "../demand/demand.model.js";
import { OrderModel } from "../orders/order.model.js";
import { RatingModel } from "../ratings/rating.model.js";
import { DarkStoreProductModel } from "../dark-store/dark-store-product.model.js";
import { RecommendationModel } from "../intelligence/recommendation.model.js";
import { DarkStoreModel } from "../dark-store/dark-store.model.js";

vi.mock("../demand/demand.model.js", () => ({
  CartEventModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("../orders/order.model.js", () => ({
  OrderModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("../ratings/rating.model.js", () => ({
  RatingModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("../dark-store/dark-store-product.model.js", () => ({
  DarkStoreProductModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("../intelligence/recommendation.model.js", () => ({
  RecommendationModel: {
    aggregate: vi.fn(),
  },
}));

vi.mock("../dark-store/dark-store.model.js", () => ({
  DarkStoreModel: {
    aggregate: vi.fn(),
  },
}));

describe("AnalyticsService", () => {
  const service = new AnalyticsService();

  describe("Demand Analytics", () => {
    it("should return demand analytics", async () => {
      const mockData = [
        { productId: "prod1", totalAdds: 10, totalRemoves: 2, netDemand: 8, demandScore: 8 },
      ];
      vi.mocked(CartEventModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getDemandAnalytics();
      expect(result).toEqual(mockData);
      expect(CartEventModel.aggregate).toHaveBeenCalled();
    });

    it("should return trending products", async () => {
      const mockData = [{ productId: "prod2", netDemand: 15 }];
      vi.mocked(CartEventModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getTrendingProducts(5);
      expect(result).toEqual(mockData);
    });

    it("should return hourly demand", async () => {
      const mockData = [{ hour: "09", adds: 12, removes: 4, netDemand: 8 }];
      vi.mocked(CartEventModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getHourlyDemand(new Types.ObjectId().toString());
      expect(result).toEqual(mockData);
    });

    it("should return daily demand", async () => {
      const mockData = [{ date: "2026-07-07", netDemand: 145 }];
      vi.mocked(CartEventModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getDailyDemand(new Types.ObjectId().toString());
      expect(result).toEqual(mockData);
    });
  });

  describe("Order Analytics", () => {
    it("should return order analytics", async () => {
      const mockData = [
        {
          productId: "prod1",
          totalOrders: 10,
          completedOrders: 8,
          cancelledOrders: 2,
          totalQuantitySold: 12,
        },
      ];
      vi.mocked(OrderModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getOrderAnalytics();
      expect(result).toEqual(mockData);
      expect(OrderModel.aggregate).toHaveBeenCalled();
    });

    it("should return top selling products", async () => {
      const mockData = [{ productId: "prod1", quantitySold: 50 }];
      vi.mocked(OrderModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getTopSellingProducts(5);
      expect(result).toEqual(mockData);
    });

    it("should return conversion analytics", async () => {
      const mockDemandData = [
        { productId: "prod1", totalAdds: 10, totalRemoves: 2, netDemand: 8, demandScore: 8 },
        { productId: "prod2", totalAdds: 5, totalRemoves: 1, netDemand: 4, demandScore: 4 },
      ];
      const mockOrderData = [
        { productId: "prod1", completedOrders: 4 },
      ];

      vi.mocked(CartEventModel.aggregate).mockResolvedValueOnce(mockDemandData);
      vi.mocked(OrderModel.aggregate).mockResolvedValueOnce(mockOrderData);

      const result = await service.getConversionAnalytics();
      expect(result).toEqual([
        {
          productId: "prod1",
          completedOrders: 4,
          netDemand: 8,
          conversionRate: 0.5,
        },
        {
          productId: "prod2",
          completedOrders: 0,
          netDemand: 4,
          conversionRate: 0,
        },
      ]);
    });

    it("should return revenue analytics", async () => {
      const mockData = [{ productId: "prod1", quantitySold: 10, revenue: 150 }];
      vi.mocked(OrderModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getRevenueAnalytics();
      expect(result).toEqual(mockData);
    });
  });

  describe("Rating Analytics", () => {
    it("should return rating analytics", async () => {
      const mockData = [
        {
          productId: "prod1",
          averageRating: 4.5,
          totalRatings: 10,
          fiveStar: 5,
          fourStar: 5,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0,
        },
      ];
      vi.mocked(RatingModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getRatingAnalytics();
      expect(result).toEqual(mockData);
      expect(RatingModel.aggregate).toHaveBeenCalled();
    });

    it("should return top rated products", async () => {
      const mockData = [{ productId: "prod1", averageRating: 4.8, totalRatings: 50 }];
      vi.mocked(RatingModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getTopRatedProducts(5);
      expect(result).toEqual(mockData);
    });

    it("should return rating distribution", async () => {
      const mockData = [
        {
          fiveStar: 50,
          fourStar: 30,
          threeStar: 10,
          twoStar: 5,
          oneStar: 5,
        },
      ];
      vi.mocked(RatingModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getRatingDistribution();
      expect(result).toEqual(mockData[0]);
    });

    it("should return default distribution if empty", async () => {
      vi.mocked(RatingModel.aggregate).mockResolvedValueOnce([]);

      const result = await service.getRatingDistribution();
      expect(result).toEqual({
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      });
    });

    it("should return rating trend", async () => {
      const mockData = [
        { day: "2026-07-07", averageRating: 4.5 },
      ];
      vi.mocked(RatingModel.aggregate).mockResolvedValueOnce(mockData);

      const result = await service.getRatingTrend();
      expect(result).toEqual(mockData);
    });
  });

  describe("Inventory Analytics", () => {
    it("should return inventory health", async () => {
      const mockData = [{ productId: "prod1", darkStoreId: "store1", availableQuantity: 10, reservedQuantity: 0, reorderLevel: 5, healthStatus: "HEALTHY" }];
      vi.mocked(DarkStoreProductModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getInventoryHealth();
      expect(result).toEqual(mockData);
    });

    it("should return low stock products", async () => {
      const mockData = [{ productId: "prod1", darkStoreId: "store1", availableQuantity: 5, reservedQuantity: 0, reorderLevel: 5 }];
      vi.mocked(DarkStoreProductModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getLowStockProducts();
      expect(result).toEqual(mockData);
    });

    it("should return out of stock products", async () => {
      const mockData = [{ productId: "prod1", darkStoreId: "store1", availableQuantity: 0, reservedQuantity: 0 }];
      vi.mocked(DarkStoreProductModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getOutOfStockProducts();
      expect(result).toEqual(mockData);
    });

    it("should return over stock products", async () => {
      const mockData = [{ productId: "prod1", darkStoreId: "store1", availableQuantity: 100, reservedQuantity: 0, reorderLevel: 5 }];
      vi.mocked(DarkStoreProductModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getOverStockProducts();
      expect(result).toEqual(mockData);
    });

    it("should return inventory summary", async () => {
      const mockData = [{ totalProducts: 100, totalAvailable: 500, totalReserved: 50, lowStockCount: 10, outOfStockCount: 2 }];
      vi.mocked(DarkStoreProductModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getInventorySummary();
      expect(result).toEqual(mockData[0]);
    });
  });

  describe("Recommendation Analytics", () => {
    it("should return recommendation analytics", async () => {
      const mockData = [{ pending: 10, approved: 5, rejected: 2, expired: 1, total: 18 }];
      vi.mocked(RecommendationModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getRecommendationAnalytics();
      expect(result).toEqual(mockData[0]);
    });

    it("should return recommendation distribution", async () => {
      const mockData = [{ REORDER: 10, RETURN_TO_WAREHOUSE: 5, DO_NOT_REORDER: 2, NO_ACTION: 1 }];
      vi.mocked(RecommendationModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getRecommendationDistribution();
      expect(result).toEqual(mockData[0]);
    });

    it("should return recommendation trend", async () => {
      const mockData = [{ day: "2026-07-07", recommendations: 10 }];
      vi.mocked(RecommendationModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getRecommendationTrend();
      expect(result).toEqual(mockData);
    });
  });

  describe("Dark Store Dashboard", () => {
    it("should return dark store dashboard for all stores", async () => {
      const mockData = [{ darkStoreId: "store1", totalProducts: 100, availableInventory: 500, reservedInventory: 50, totalOrders: 10, completedOrders: 8, averageRating: 4.5, pendingRecommendations: 5, approvedRecommendations: 2 }];
      vi.mocked(DarkStoreModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getDarkStoreDashboard();
      expect(result).toEqual(mockData);
    });

    it("should return dark store dashboard by id", async () => {
      const mockData = [{ darkStoreId: "store1", totalProducts: 100, availableInventory: 500, reservedInventory: 50, totalOrders: 10, completedOrders: 8, averageRating: 4.5, pendingRecommendations: 5, approvedRecommendations: 2 }];
      vi.mocked(DarkStoreModel.aggregate).mockResolvedValueOnce(mockData);
      const result = await service.getDarkStoreDashboardById(new Types.ObjectId().toString());
      expect(result).toEqual(mockData[0]);
    });
  });
});
