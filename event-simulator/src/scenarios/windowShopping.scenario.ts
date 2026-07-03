import type { Scenario } from "./scenario.types.js";

export const windowShoppingScenario: Scenario = {
  id: "WINDOW_SHOPPING",
  name: "Window Shopping MacBook",
  description:
    "Customers frequently view or add the target product to cart, but very few complete purchases, suggesting weak buying intent and no reorder pressure.",
  durationMinutes: 30,
  targetProducts: ["MacBook"],
  targetDarkStores: ["ALL"],
  behavior: {
    cartEventsPerMinute: 100,
    conversionRate: 0.05,
    reviewParticipationRate: 0.08,
    averageRating: 3.2,
  },
};
