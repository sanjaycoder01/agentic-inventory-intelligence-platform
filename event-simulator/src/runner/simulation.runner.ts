import { randomUUID } from "node:crypto";
import { createCustomer } from "../behavior/customer.factory.js";
import { listAvailableDarkStoreIds } from "../context/darkStore.context.js";
import type { DarkStoreContext } from "../context/context.types.js";
import { decideCustomerAction } from "../decision/decision.engine.js";
import type { DispatchableSimulatorEvent } from "../dispatch/event.dispatcher.js";
import { generateCartEvents } from "../generators/cart.generator.js";
import { generateOrderEvent } from "../generators/order.generator.js";
import { generateRatingEvent } from "../generators/rating.generator.js";
import { getScenario } from "../scenarios/scenario.registry.js";
import type { Scenario, ScenarioId } from "../scenarios/scenario.types.js";
import { buildSimulationSummary, type SimulationSummary } from "./simulation.summary.js";
import type {
  GeneratedEventCounts,
  RunScenarioInput,
  SimulationRunnerDependencies,
  SimulationRunnerPort,
} from "./runner.types.js";

export class SimulationRunner implements SimulationRunnerPort {
  constructor(private readonly dependencies: SimulationRunnerDependencies) {}

  async runScenario(
    scenarioId: ScenarioId,
    input: RunScenarioInput,
  ): Promise<SimulationSummary> {
    const startedAt = Date.now();
    const scenario = getScenario(scenarioId);
    const simulationRunId = input.simulationRunId ?? createSimulationRunId();
    const customerCount = input.customerCount ?? estimateCustomerCount(scenario);
    const darkStoreIds = listAvailableDarkStoreIds(scenario, input.contexts);
    const customers = createCustomers(
      scenario,
      customerCount,
      darkStoreIds,
    );

    const events = generateScenarioEvents(
      scenario,
      customers,
      input.contexts,
      simulationRunId,
    );

    this.dependencies.pipeline.enqueueMany(events.list);
    await this.dependencies.scheduler.start();
    await this.dependencies.scheduler.waitUntilComplete();

    return buildSimulationSummary({
      simulationRunId,
      scenario: scenarioId,
      customers: customerCount,
      cartEvents: events.counts.cartEvents,
      orders: events.counts.orders,
      ratings: events.counts.ratings,
      durationSeconds: toDurationSeconds(startedAt),
      completed: true,
    });
  }
}

function createCustomers(
  scenario: Scenario,
  customerCount: number,
  darkStoreIds: string[],
): ReturnType<typeof createCustomer>[] {
  return Array.from({ length: customerCount }, () =>
    createCustomer(scenario, darkStoreIds),
  );
}

function generateScenarioEvents(
  scenario: Scenario,
  customers: ReturnType<typeof createCustomer>[],
  contexts: DarkStoreContext[],
  simulationRunId: string,
): { list: DispatchableSimulatorEvent[]; counts: GeneratedEventCounts } {
  const list: DispatchableSimulatorEvent[] = [];
  const counts: GeneratedEventCounts = {
    cartEvents: 0,
    orders: 0,
    ratings: 0,
  };

  for (const customer of customers) {
    const decision = decideCustomerAction(scenario, customer, contexts);
    const cartEvents = generateCartEvents(decision, simulationRunId);
    const orderEvent = generateOrderEvent(decision, simulationRunId);
    const ratingEvent = generateRatingEvent(decision, orderEvent);

    if (cartEvents.length > 0) {
      list.push(...cartEvents);
      counts.cartEvents += cartEvents.length;
    }

    if (orderEvent) {
      list.push(orderEvent);
      counts.orders += 1;
    }

    if (ratingEvent) {
      list.push(ratingEvent);
      counts.ratings += 1;
    }
  }

  return { list, counts };
}

export function estimateCustomerCount(scenario: Scenario): number {
  const targetCartInteractions =
    scenario.behavior.cartEventsPerMinute * scenario.durationMinutes;

  return Math.max(50, Math.ceil(targetCartInteractions / 7.2));
}

function createSimulationRunId(): string {
  return `sim-${Date.now()}-${randomUUID()}`;
}

function toDurationSeconds(startedAt: number): number {
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}
