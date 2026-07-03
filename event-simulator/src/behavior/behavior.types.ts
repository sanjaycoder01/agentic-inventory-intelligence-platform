import type { PersonaId } from "../scenarios/scenario.types.js";

export interface CustomerPersona {
  id: PersonaId;
  name: string;
  preferredCategories: string[];
  orderProbability: number;
  removeCartProbability: number;
  ratingProbability: number;
}

export interface Customer {
  id: string;
  personaId: PersonaId;
  darkStoreId: string;
  preferredCategories: string[];
  orderProbability: number;
  removeCartProbability: number;
  ratingProbability: number;
}

export interface CustomerDecision {
  addToCart: boolean;
  removeFromCart: boolean;
  placeOrder: boolean;
  leaveRating: boolean;
  rating?: number;
}
