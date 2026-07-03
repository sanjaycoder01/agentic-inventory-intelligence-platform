import type { DarkStoreContext } from "../context/context.types.js";
import type { EventPipeline } from "../pipeline/pipeline.types.js";
import type { DispatchableSimulatorEvent } from "../dispatch/event.dispatcher.js";
import type { EventSchedulerPort } from "../scheduler/scheduler.types.js";
import type { ScenarioId } from "../scenarios/scenario.types.js";
import type { SimulationSummary } from "./simulation.summary.js";

export interface RunScenarioInput {
  contexts: DarkStoreContext[];
  customerCount?: number;
  simulationRunId?: string;
}

export interface SimulationRunnerDependencies {
  pipeline: EventPipeline<DispatchableSimulatorEvent>;
  scheduler: EventSchedulerPort;
}

export interface SimulationRunnerPort {
  runScenario(
    scenarioId: ScenarioId,
    input: RunScenarioInput,
  ): Promise<SimulationSummary>;
}

export interface GeneratedEventCounts {
  cartEvents: number;
  orders: number;
  ratings: number;
}
