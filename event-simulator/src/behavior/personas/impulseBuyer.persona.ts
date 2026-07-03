import type { CustomerPersona } from "../behavior.types.js";

export const impulseBuyerPersona: CustomerPersona = {
  id: "IMPULSE_BUYER",
  name: "Impulse Buyer",
  preferredCategories: ["Snacks", "Desserts", "Limited Offers"],
  orderProbability: 0.62,
  removeCartProbability: 0.18,
  ratingProbability: 0.1,
};
