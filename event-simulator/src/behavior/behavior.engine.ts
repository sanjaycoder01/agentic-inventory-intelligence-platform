import type { Customer, CustomerDecision } from "./behavior.types.js";
import {
  blendProbabilities,
  ratingAroundAverage,
  shouldAddToCart,
  shouldLeaveRating,
  shouldOrder,
  shouldRemoveFromCart,
} from "./probability.js";
import type { Scenario } from "../scenarios/scenario.types.js";

export function decideCustomerBehavior(
  scenario: Scenario,
  customer: Customer,
): CustomerDecision {
  const addToCart = shouldAddToCart(cartInterestProbability(scenario));
  const removeFromCart =
    addToCart && shouldRemoveFromCart(customer.removeCartProbability);
  const placeOrder =
    addToCart &&
    !removeFromCart &&
    shouldOrder(
      blendProbabilities(
        scenario.behavior.conversionRate,
        customer.orderProbability,
      ),
    );
  const leaveRating =
    placeOrder &&
    shouldLeaveRating(
      blendProbabilities(
        scenario.behavior.reviewParticipationRate,
        customer.ratingProbability,
      ),
    );

  return {
    addToCart,
    removeFromCart,
    placeOrder,
    leaveRating,
    rating: leaveRating
      ? ratingAroundAverage(scenario.behavior.averageRating)
      : undefined,
  };
}

function cartInterestProbability(scenario: Scenario): number {
  return scenario.behavior.cartEventsPerMinute > 0 ? 1 : 0;
}
