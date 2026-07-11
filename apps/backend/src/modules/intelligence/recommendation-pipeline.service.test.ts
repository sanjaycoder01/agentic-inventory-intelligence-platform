import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendationType } from "./recommendation.types.js";

const mockAggregateSignals = vi.fn();
const mockSaveRecommendation = vi.fn();
const mockExpirePending = vi.fn();
const mockGetRecommendation = vi.fn();
const mockLogDecision = vi.fn();

vi.mock("./signal-aggregator.service.js", () => ({
  signalAggregatorService: {
    aggregateSignals: (...args: unknown[]) => mockAggregateSignals(...args),
  },
}));

vi.mock("./recommendation-persistence.service.js", () => ({
  recommendationPersistenceService: {
    saveRecommendation: (...args: unknown[]) => mockSaveRecommendation(...args),
    expirePendingForProduct: (...args: unknown[]) => mockExpirePending(...args),
    getRecommendation: (...args: unknown[]) => mockGetRecommendation(...args),
  },
}));

vi.mock("./agent-decision.service.js", () => ({
  agentDecisionService: {
    log: (...args: unknown[]) => mockLogDecision(...args),
  },
}));

vi.mock("./explanation.service.js", async () => {
  const actual = await vi.importActual<typeof import("./explanation.service.js")>(
    "./explanation.service.js",
  );
  return {
    explanationService: {
      explain: actual.explanationService.explain.bind(actual.explanationService),
      explainWithLlm: async (
        recommendation: Parameters<typeof actual.explanationService.explain>[0],
        signals: Parameters<typeof actual.explanationService.explain>[1],
        options?: Parameters<typeof actual.explanationService.explain>[2],
      ) => actual.explanationService.explain(recommendation, signals, options),
    },
  };
});

vi.mock("../dark-store/dark-store.model.js", () => ({
  DarkStoreModel: {
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock("../products/product.model.js", () => ({
  ProductModel: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

import { RecommendationPipelineService } from "./recommendation-pipeline.service.js";

describe("RecommendationPipelineService", () => {
  const pipeline = new RecommendationPipelineService();

  beforeEach(() => {
    vi.clearAllMocks();
    mockExpirePending.mockResolvedValue(false);
    mockLogDecision.mockResolvedValue({});
    mockSaveRecommendation.mockImplementation(async (input) => ({
      recommendationId: "rec-1",
      recommendation: input.recommendation.recommendation,
      eligible: input.eligibility.eligible,
      status: input.status ?? "PENDING",
    }));
  });

  it("creates a reorder recommendation when signals pass the gate", async () => {
    mockAggregateSignals.mockResolvedValue({
      productId: "milk",
      darkStoreId: "store-1",
      demandScore: 0.9,
      conversionScore: 0.7,
      ratingScore: 0.84,
      replenishmentScore: 0.82,
      cartCount24h: 24,
      windowHours: 24,
      availableQuantity: 5,
      reservedQuantity: 0,
      warehouseStock: 100,
      averageRating: 4.2,
      totalRatings: 20,
    });

    const result = await pipeline.runForProduct("milk", "store-1");

    expect(result.status).toBe("created");
    expect(result.recommendation).toBe(RecommendationType.REORDER);
    expect(result.eligible).toBe(true);
    expect(result.blocked).toBe(false);
    expect(mockExpirePending).toHaveBeenCalledWith("milk", "store-1");
    expect(mockSaveRecommendation).toHaveBeenCalledOnce();
    expect(mockLogDecision).toHaveBeenCalled();
  });

  it("marks recommendation blocked when warehouse stock is insufficient", async () => {
    mockAggregateSignals.mockResolvedValue({
      productId: "milk",
      darkStoreId: "store-1",
      demandScore: 0.9,
      conversionScore: 0.7,
      ratingScore: 0.84,
      replenishmentScore: 0.82,
      cartCount24h: 24,
      windowHours: 24,
      availableQuantity: 5,
      reservedQuantity: 0,
      warehouseStock: 10,
      averageRating: 4.2,
      totalRatings: 20,
    });

    const result = await pipeline.runForProduct("milk", "store-1");

    expect(result.recommendation).toBe(RecommendationType.REORDER);
    expect(result.eligible).toBe(false);
    expect(result.blocked).toBe(true);

    const saveInput = mockSaveRecommendation.mock.calls[0][0];
    expect(saveInput.explanation.summary).toContain("Blocked");
    expect(saveInput.eligibility.eligible).toBe(false);
    expect(saveInput.status).toBe("BLOCKED");
  });

  it("creates a non-reorder recommendation when score is below threshold", async () => {
    mockAggregateSignals.mockResolvedValue({
      productId: "macbook",
      darkStoreId: "store-1",
      demandScore: 0.9,
      conversionScore: 0.2,
      ratingScore: 0.3,
      replenishmentScore: 0.51,
      cartCount24h: 40,
      windowHours: 24,
      availableQuantity: 5,
      reservedQuantity: 0,
      warehouseStock: 50,
      averageRating: 1.5,
      totalRatings: 10,
    });

    const result = await pipeline.runForProduct("macbook", "store-1");

    expect(result.eligible).toBe(false);
    expect(result.recommendation).not.toBe(RecommendationType.REORDER);
  });
});
