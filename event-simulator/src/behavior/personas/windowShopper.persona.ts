import type { CustomerPersona } from "../behavior.types.js";

export const windowShopperPersona: CustomerPersona = {
  id: "WINDOW_SHOPPER",
  name: "Window Shopper",
  preferredCategories: ["Electronics", "Premium Grocery", "Beauty"],
  orderProbability: 0.08,
  removeCartProbability: 0.72,
  ratingProbability: 0.04,
};
