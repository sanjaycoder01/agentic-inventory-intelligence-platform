import type { Customer } from "./behavior.types.js";
import { getPersona } from "./personas/persona.registry.js";
import { weightedPick } from "./probability.js";
import type { Scenario } from "../scenarios/scenario.types.js";

let customerSequence = 0;

export function createCustomer(
  scenario: Scenario,
  availableDarkStoreIds: string[] = scenario.targetDarkStores,
): Customer {
  const personaMix = weightedPick(scenario.personaMix);
  const persona = getPersona(personaMix.personaId);

  return {
    id: `customer-${Date.now()}-${++customerSequence}`,
    personaId: persona.id,
    darkStoreId: pickDarkStore(availableDarkStoreIds),
    preferredCategories: persona.preferredCategories,
    orderProbability: persona.orderProbability,
    removeCartProbability: persona.removeCartProbability,
    ratingProbability: persona.ratingProbability,
  };
}

function pickDarkStore(targetDarkStores: string[]): string {
  if (targetDarkStores.length === 0 || targetDarkStores.includes("ALL")) {
    return "ALL";
  }

  return targetDarkStores[Math.floor(Math.random() * targetDarkStores.length)];
}
