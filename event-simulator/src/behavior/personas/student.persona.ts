import type { CustomerPersona } from "../behavior.types.js";

export const studentPersona: CustomerPersona = {
  id: "STUDENT",
  name: "Student",
  preferredCategories: ["Snacks", "Cold Drinks", "Instant Food"],
  orderProbability: 0.55,
  removeCartProbability: 0.28,
  ratingProbability: 0.08,
};
