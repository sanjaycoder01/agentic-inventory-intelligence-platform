import type { Scenario } from "./scenario.types.js";

export const poorRatingScenario: Scenario = {
  id: "POOR_RATING",
  name: "Poor Rating Staples",
  description:
    "Customers show strong demand and complete purchases, but post-purchase feedback is poor, making reorder recommendations unlikely despite healthy conversion.",
  durationMinutes: 30,
  targetProducts: ["Staples"],
  targetDarkStores: ["ALL"],
  personaMix: [
    { personaId: "FREQUENT_BUYER", weight: 0.45 },
    { personaId: "FAMILY", weight: 0.35 },
    { personaId: "OFFICE_EMPLOYEE", weight: 0.2 },
  ],
  behavior: {
    cartEventsPerMinute: 90,
    conversionRate: 0.75,
    reviewParticipationRate: 0.18,
    averageRating: 2.1,
  },
};
