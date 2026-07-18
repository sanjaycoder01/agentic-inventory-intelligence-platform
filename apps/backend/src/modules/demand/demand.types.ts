import type { CartEventDocument } from "./demand.model.js";
import type { DemandIntelligenceMetrics } from "./demand-intelligence.types.js";

export type {
  DemandIntelligenceMetrics,
  DemandTrendLabel,
  DemandVelocityLabel,
  DemandWindowCounts,
  ProductDemandDTO,
} from "./demand-intelligence.types.js";

export interface CartEventResponseDTO {
  id: string;
  eventId: string;
  productId: string;
  darkStoreId: string;
  quantity: number;
  eventType: string;
  eventTimestamp: Date;
  sessionId: string;
  createdAt: Date;
}

export interface TrendingProductDTO {
  productId: string;
  cartCount24h: number;
  demandScore: number;
}

type CartEventLike = CartEventDocument & {
  _id: { toString(): string };
  productId: { toString(): string };
  darkStoreId: { toString(): string };
  createdAt: Date;
};

export function toCartEventResponseDTO(event: CartEventLike): CartEventResponseDTO {
  return {
    id: event._id.toString(),
    eventId: event.eventId,
    productId: event.productId.toString(),
    darkStoreId: event.darkStoreId.toString(),
    quantity: event.quantity,
    eventType: event.eventType,
    eventTimestamp: event.eventTimestamp,
    sessionId: event.sessionId,
    createdAt: event.createdAt,
  };
}

/** Flatten demand intelligence into explanation factor strings */
export function demandIntelligenceFactorLines(
  metrics: DemandIntelligenceMetrics,
): string[] {
  return [
    `Demand Score: ${metrics.demandScore.toFixed(2)}`,
    `Demand 5m: ${metrics.last5Min}`,
    `Demand 30m: ${metrics.last30Min}`,
    `Demand 2h: ${metrics.last2Hours}`,
    `Demand 24h: ${metrics.last24Hours}`,
    `Demand Velocity: ${metrics.velocity} (${metrics.velocityPercent}%)`,
    `Demand Trend: ${metrics.trend}`,
    `Baseline Multiplier: ${metrics.baselineMultiplier}x`,
  ];
}
