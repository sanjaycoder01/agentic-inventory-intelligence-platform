import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import cron, { type ScheduledTask } from 'node-cron';
import { runSimulation } from '../simulate-run.js';
import type { ScenarioId } from '../scenarios/scenario.types.js';

// Prefer event-simulator/.env, then monorepo root .env
for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

const SCENARIO_ROTATION: ScenarioId[] = [
  'HIGH_DEMAND',
  'WINDOW_SHOPPING',
  'POOR_RATING',
  'DEAD_STOCK',
];

export interface SimulatorCronOptions {
  /** Default: every 1 minute */
  cronExpression?: string;
  enabled?: boolean;
  /** Customers per tick. Default from SIMULATOR_CRON_CUSTOMERS or 25 */
  customerCount?: number;
  /** Fixed scenario; if omitted, rotates HIGH_DEMAND → WINDOW_SHOPPING → … */
  scenarioId?: ScenarioId;
}

/**
 * Cron A — continuous customer behaviour simulation.
 * Publishes events to SQS; the separate consumer persists them to MongoDB.
 * Independent of Cron B (replenishment) and Cron C (sales optimization).
 */
export class SimulatorCron {
  private task: ScheduledTask | null = null;
  private running = false;
  private tickIndex = 0;
  private readonly cronExpression: string;
  private readonly enabled: boolean;
  private readonly customerCount: number;
  private readonly scenarioId?: ScenarioId;

  constructor(options: SimulatorCronOptions = {}) {
    this.cronExpression =
      options.cronExpression ??
      process.env.SIMULATOR_CRON_EXPRESSION ??
      '*/1 * * * *';
    this.enabled =
      options.enabled ??
      (process.env.SIMULATOR_CRON_ENABLED ?? 'true').toLowerCase() === 'true';
    this.customerCount =
      options.customerCount ??
      Number(process.env.SIMULATOR_CRON_CUSTOMERS || 25);
    this.scenarioId =
      options.scenarioId ??
      (process.env.SIMULATOR_CRON_SCENARIO as ScenarioId | undefined);
  }

  start(): void {
    if (!this.enabled) {
      console.log('[SimulatorCron] Disabled — skipping start');
      return;
    }

    if (this.task) {
      return;
    }

    if (!cron.validate(this.cronExpression)) {
      throw new Error(
        `Invalid simulator cron expression: ${this.cronExpression}`,
      );
    }

    this.task = cron.schedule(this.cronExpression, () => {
      void this.tick();
    });

    console.log(
      JSON.stringify({
        action: 'SimulatorCronStarted',
        cronExpression: this.cronExpression,
        customerCount: this.customerCount,
        scenarioMode: this.scenarioId ?? 'ROTATE',
        queueProvider: process.env.QUEUE_PROVIDER || 'MEMORY',
      }),
    );

    // Run once immediately so the loop doesn't wait a full minute
    void this.tick();
  }

  stop(): void {
    if (!this.task) {
      return;
    }
    this.task.stop();
    this.task = null;
    console.log('[SimulatorCron] Stopped');
  }

  async tick(): Promise<void> {
    if (this.running) {
      console.log(
        JSON.stringify({
          action: 'SimulatorCronSkipped',
          reason: 'previous_tick_in_progress',
        }),
      );
      return;
    }

    this.running = true;
    const startedAt = Date.now();
    const scenarioId =
      this.scenarioId ??
      SCENARIO_ROTATION[this.tickIndex % SCENARIO_ROTATION.length];
    this.tickIndex += 1;

    try {
      const result = await runSimulation({
        scenarioId,
        customerCount: this.customerCount,
        batchSize: Number(process.env.SQS_MAX_BATCH_SIZE || 10),
      });

      console.log(
        JSON.stringify({
          action: 'SimulatorCronCompleted',
          scenarioId: result.scenarioId,
          customerCount: result.customerCount,
          cartEvents: result.summary.cartEvents,
          orders: result.summary.orders,
          ratings: result.summary.ratings,
          durationMs: Date.now() - startedAt,
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          action: 'SimulatorCronFailed',
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - startedAt,
        }),
      );
    } finally {
      this.running = false;
    }
  }
}

async function main() {
  const cronA = new SimulatorCron();
  cronA.start();

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down SimulatorCron...`);
    cronA.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      action: 'SimulatorCronBootFailed',
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
