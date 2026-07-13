import { EventScheduler } from './scheduler/event.scheduler.js';
import { SimulationRunner } from './runner/simulation.runner.js';
import { queueFactory } from './queue/queue.factory.js';
import { EventDispatcher } from './dispatch/event.dispatcher.js';
import { BackendClient } from './services/backend.client.js';
import { listAvailableDarkStoreIds } from './context/darkStore.context.js';
import { getScenario } from './scenarios/scenario.registry.js';
import { createDefaultSimulationContexts } from './simulate-context.js';
import type { ScenarioId } from './scenarios/scenario.types.js';

export interface RunSimulationOptions {
  scenarioId?: ScenarioId;
  customerCount?: number;
  simulationRunId?: string;
  eventsPerSecond?: number;
  batchSize?: number;
}

export interface RunSimulationResult {
  scenarioId: ScenarioId;
  customerCount: number;
  darkStoreIds: string[];
  summary: Awaited<ReturnType<SimulationRunner['runScenario']>>;
}

/**
 * Shared simulation entry used by CLI (`npm run simulate`) and Cron A.
 * Publishes Cart / Order / Rating events to the configured queue (SQS or memory).
 */
export async function runSimulation(
  options: RunSimulationOptions = {},
): Promise<RunSimulationResult> {
  const scenarioId = (options.scenarioId ?? 'HIGH_DEMAND') as ScenarioId;
  const customerCount = options.customerCount ?? 50;
  const simulationRunId = options.simulationRunId ?? process.env.SIMULATION_RUN_ID;

  const pipeline = queueFactory.createPipeline() as any;
  const backendClient = new BackendClient();
  const dispatcher = new EventDispatcher(backendClient);
  const scheduler = new EventScheduler(pipeline, dispatcher, {
    eventsPerSecond: options.eventsPerSecond ?? 20,
    batchSize: options.batchSize ?? 10,
  });
  const runner = new SimulationRunner({ pipeline, scheduler });

  const scenario = getScenario(scenarioId);
  const contexts = await createDefaultSimulationContexts();
  const darkStoreIds = listAvailableDarkStoreIds(scenario, contexts);

  console.log(
    JSON.stringify({
      action: 'SimulationStarting',
      scenarioId,
      customerCount,
      scenarioTargets: scenario.targetProducts,
      darkStoreIds,
      catalogProducts: contexts.reduce(
        (total, context) => total + context.catalogProducts.length,
        0,
      ),
    }),
  );

  const summary = await runner.runScenario(scenarioId, {
    contexts,
    customerCount,
    simulationRunId,
  });

  // Ensure SQS publish promises settle before the cron tick ends
  if (typeof pipeline.waitForAll === 'function') {
    await pipeline.waitForAll();
  }

  console.log(
    JSON.stringify({
      action: 'SimulationCompleted',
      scenarioId,
      customerCount,
      darkStoreIds,
      summary,
    }),
  );

  return { scenarioId, customerCount, darkStoreIds, summary };
}
