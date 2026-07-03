import type { CustomerPersona } from "../behavior.types.js";

export const familyPersona: CustomerPersona = {
  id: "FAMILY",
  name: "Family",
  preferredCategories: ["Milk", "Rice", "Vegetables", "Oil"],
  orderProbability: 0.9,
  removeCartProbability: 0.08,
  ratingProbability: 0.25,
};
