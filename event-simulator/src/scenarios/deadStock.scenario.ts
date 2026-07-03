import type { Scenario } from "./scenario.types.js";

export const deadStockScenario: Scenario = {
  id: "DEAD_STOCK",
  name: "Dead Stock Premium Cereal",
  description:
    "Inventory exists but customers show little interest, producing low cart activity and low order volume that should lead toward discounting instead of reordering.",
  durationMinutes: 30,
  targetProducts: ["Premium Cereal"],
  targetDarkStores: ["ALL"],
  behavior: {
    cartEventsPerMinute: 8,
    conversionRate: 0.12,
    reviewParticipationRate: 0.05,
    averageRating: 3.6,
  },
};
