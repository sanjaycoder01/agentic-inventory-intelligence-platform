import type { CustomerPersona } from "../behavior.types.js";

export const officeEmployeePersona: CustomerPersona = {
  id: "OFFICE_EMPLOYEE",
  name: "Office Employee",
  preferredCategories: ["Coffee", "Ready Meals", "Fruits"],
  orderProbability: 0.7,
  removeCartProbability: 0.16,
  ratingProbability: 0.12,
};
