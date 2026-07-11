import 'dotenv/config';
import { EventScheduler } from './scheduler/event.scheduler.js';
import { SimulationRunner } from './runner/simulation.runner.js';
import { queueFactory } from './queue/queue.factory.js';
import { EventDispatcher } from './dispatch/event.dispatcher.js';
import { BackendClient } from './services/backend.client.js';
import { listAvailableDarkStoreIds } from './context/darkStore.context.js';
import { getScenario } from './scenarios/scenario.registry.js';
import { createDefaultSimulationContexts } from './simulate-context.js';

async function main() {
  const scenarioId = (process.argv[2] as any) || 'HIGH_DEMAND';
  const customerCount = Number(process.argv[3] || 50);
  const simulationRunId = process.env.SIMULATION_RUN_ID;

  const pipeline = queueFactory.createPipeline() as any;
  const backendClient = new BackendClient();
  const dispatcher = new EventDispatcher(backendClient);
  const scheduler = new EventScheduler(pipeline, dispatcher, {
    eventsPerSecond: 20,
    batchSize: 10,
  });
  const runner = new SimulationRunner({ pipeline, scheduler });

  const scenario = getScenario(scenarioId as any);
  const contexts = await createDefaultSimulationContexts();
  const darkStoreIds = listAvailableDarkStoreIds(scenario, contexts);

  console.log(JSON.stringify({
    action: 'SimulationStarting',
    scenarioId,
    customerCount,
    scenarioTargets: scenario.targetProducts,
    darkStoreIds,
    catalogProducts: contexts.reduce(
      (total, context) => total + context.catalogProducts.length,
      0,
    ),
  }));

  const summary = await runner.runScenario(scenarioId as any, {
    contexts,
    customerCount,
    simulationRunId,
  });

  console.log(JSON.stringify({
    action: 'SimulationCompleted',
    scenarioId,
    customerCount,
    darkStoreIds,
    summary,
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({ action: 'SimulationFailed', error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
});
