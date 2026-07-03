import type { ScenarioId } from "../scenarios/scenario.types.js";

export interface SimulationSummary {
  simulationRunId: string;
  scenario: ScenarioId;
  customers: number;
  cartEvents: number;
  orders: number;
  ratings: number;
  durationSeconds: number;
  completed: boolean;
}

export function buildSimulationSummary(
  summary: SimulationSummary,
): SimulationSummary {
  return summary;
}
