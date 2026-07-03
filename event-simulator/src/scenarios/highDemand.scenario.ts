import type { Scenario } from "./scenario.types.js";

export const highDemandScenario: Scenario = {
  id: "HIGH_DEMAND",
  name: "High Demand Milk",
  description:
    "Customers strongly prefer the target product, resulting in frequent cart activity, high conversion, excellent ratings, and a likely reorder recommendation.",
  durationMinutes: 30,
  targetProducts: ["Milk"],
  targetDarkStores: ["ALL"],
  behavior: {
    cartEventsPerMinute: 120,
    conversionRate: 0.9,
    reviewParticipationRate: 0.2,
    averageRating: 4.8,
  },
};
