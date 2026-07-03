export type ScenarioId =
  | "HIGH_DEMAND"
  | "WINDOW_SHOPPING"
  | "POOR_RATING"
  | "DEAD_STOCK";

export interface ScenarioBehavior {
  cartEventsPerMinute: number;
  conversionRate: number;
  reviewParticipationRate: number;
  averageRating: number;
}

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  durationMinutes: number;
  targetProducts: string[];
  targetDarkStores: string[];
  behavior: ScenarioBehavior;
}
