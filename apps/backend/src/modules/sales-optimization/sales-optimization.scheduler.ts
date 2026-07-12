import cron, { type ScheduledTask } from "node-cron";
import { SALES_OPT_CRON_DEFAULT } from "./sales-optimization.constants.js";
import { salesOptimizationPipelineService } from "./sales-optimization.pipeline.js";

export interface SalesOptimizationSchedulerOptions {
  cronExpression?: string;
  enabled?: boolean;
  darkStoreId?: string;
}

/** Separate from replenishment Cron B — runs sales optimization every 15 minutes. */
export class SalesOptimizationScheduler {
  private task: ScheduledTask | null = null;
  private running = false;
  private readonly cronExpression: string;
  private readonly enabled: boolean;
  private readonly darkStoreId?: string;

  constructor(options: SalesOptimizationSchedulerOptions = {}) {
    this.cronExpression = options.cronExpression ?? SALES_OPT_CRON_DEFAULT;
    this.enabled = options.enabled ?? true;
    this.darkStoreId = options.darkStoreId;
  }

  start(): void {
    if (!this.enabled) {
      console.log("[SalesOptimizationScheduler] Disabled — skipping start");
      return;
    }
    if (this.task) return;

    if (!cron.validate(this.cronExpression)) {
      throw new Error(
        `Invalid sales optimization cron expression: ${this.cronExpression}`,
      );
    }

    this.task = cron.schedule(this.cronExpression, () => {
      void this.tick();
    });
    console.log(
      `[SalesOptimizationScheduler] Started (${this.cronExpression})`,
    );
  }

  stop(): void {
    if (!this.task) return;
    this.task.stop();
    this.task = null;
    console.log("[SalesOptimizationScheduler] Stopped");
  }

  async tick(): Promise<void> {
    if (this.running) {
      console.log(
        "[SalesOptimizationScheduler] Previous run still in progress — skipping",
      );
      return;
    }

    this.running = true;
    const startedAt = Date.now();
    try {
      const result = await salesOptimizationPipelineService.generate({
        darkStoreId: this.darkStoreId,
      });
      console.log(
        JSON.stringify({
          action: "SalesOptimizationCronCompleted",
          darkStoreId: result.darkStoreId,
          processed: result.processed,
          created: result.created,
          failed: result.failed,
          durationMs: Date.now() - startedAt,
        }),
      );
    } catch (error) {
      console.error(
        "[SalesOptimizationScheduler] Run failed:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      this.running = false;
    }
  }
}
