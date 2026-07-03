import { deadStockScenario } from "./deadStock.scenario.js";
import { highDemandScenario } from "./highDemand.scenario.js";
import { poorRatingScenario } from "./poorRating.scenario.js";
import type { Scenario, ScenarioId } from "./scenario.types.js";
import { windowShoppingScenario } from "./windowShopping.scenario.js";

export const scenarios: Record<ScenarioId, Scenario> = {
  HIGH_DEMAND: highDemandScenario,
  WINDOW_SHOPPING: windowShoppingScenario,
  POOR_RATING: poorRatingScenario,
  DEAD_STOCK: deadStockScenario,
};

export function getScenario(id: ScenarioId): Scenario {
  return scenarios[id];
}

export function listScenarios(): Scenario[] {
  return Object.values(scenarios);
}
