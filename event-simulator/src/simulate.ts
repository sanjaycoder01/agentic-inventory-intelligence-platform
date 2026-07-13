import 'dotenv/config';
import { runSimulation } from './simulate-run.js';
import type { ScenarioId } from './scenarios/scenario.types.js';

async function main() {
  const scenarioId = (process.argv[2] as ScenarioId) || 'HIGH_DEMAND';
  const customerCount = Number(process.argv[3] || 50);

  await runSimulation({ scenarioId, customerCount });
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      action: 'SimulationFailed',
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});
