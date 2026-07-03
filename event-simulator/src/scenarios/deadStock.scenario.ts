import type { Scenario } from "./scenario.types.js";

export const deadStockScenario: Scenario = {
  id: "DEAD_STOCK",
  name: "Dead Stock Premium Cereal",
  description:
    "Inventory exists but customers show little interest, producing low cart activity and low order volume that should lead toward discounting instead of reordering.",
  durationMinutes: 30,
  targetProducts: ["Premium Cereal"],
  targetDarkStores: ["ALL"],
  personaMix: [
    { personaId: "WINDOW_SHOPPER", weight: 0.5 },
    { personaId: "STUDENT", weight: 0.25 },
    { personaId: "IMPULSE_BUYER", weight: 0.25 },
  ],
  behavior: {
    cartEventsPerMinute: 8,
    conversionRate: 0.12,
    reviewParticipationRate: 0.05,
    averageRating: 3.6,
  },
};
