import { pickOne } from "../behavior/probability.js";
import type { Scenario } from "../scenarios/scenario.types.js";
import type { DarkStoreContext } from "./context.types.js";

export function filterDarkStoreContexts(
  scenario: Scenario,
  contexts: DarkStoreContext[],
): DarkStoreContext[] {
  if (scenario.targetDarkStores.includes("ALL")) {
    return contexts;
  }

  return contexts.filter((context) =>
    scenario.targetDarkStores.some((target) =>
      matchesDarkStoreTarget(context, target),
    ),
  );
}

export function selectDarkStoreContext(
  scenario: Scenario,
  contexts: DarkStoreContext[],
  customerDarkStoreId?: string,
): DarkStoreContext | undefined {
  const eligibleContexts = filterDarkStoreContexts(scenario, contexts);

  if (eligibleContexts.length === 0) {
    return undefined;
  }

  if (customerDarkStoreId && customerDarkStoreId !== "ALL") {
    const customerContext = eligibleContexts.find(
      (context) => context.darkStore.id === customerDarkStoreId,
    );

    if (customerContext) {
      return customerContext;
    }
  }

  return pickOne(eligibleContexts);
}

export function listAvailableDarkStoreIds(
  scenario: Scenario,
  contexts: DarkStoreContext[],
): string[] {
  return filterDarkStoreContexts(scenario, contexts).map(
    (context) => context.darkStore.id,
  );
}

function matchesDarkStoreTarget(
  context: DarkStoreContext,
  target: string,
): boolean {
  return (
    context.darkStore.id === target ||
    context.darkStore.code === target ||
    context.darkStore.name === target
  );
}
