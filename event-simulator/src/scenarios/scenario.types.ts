export type ScenarioId =
  | "HIGH_DEMAND"
  | "WINDOW_SHOPPING"
  | "POOR_RATING"
  | "DEAD_STOCK";

export type PersonaId =
  | "STUDENT"
  | "FAMILY"
  | "OFFICE_EMPLOYEE"
  | "FREQUENT_BUYER"
  | "WINDOW_SHOPPER"
  | "IMPULSE_BUYER";

export interface PersonaMix {
  personaId: PersonaId;
  weight: number;
}

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
  personaMix: PersonaMix[];
  behavior: ScenarioBehavior;
}
