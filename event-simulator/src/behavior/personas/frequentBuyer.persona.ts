import type { CustomerPersona } from "../behavior.types.js";

export const frequentBuyerPersona: CustomerPersona = {
  id: "FREQUENT_BUYER",
  name: "Frequent Buyer",
  preferredCategories: ["Milk", "Bread", "Eggs", "Vegetables"],
  orderProbability: 0.86,
  removeCartProbability: 0.07,
  ratingProbability: 0.3,
};
