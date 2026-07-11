import cron, { type ScheduledTask } from "node-cron";
import { recommendationPipelineService } from "./recommendation-pipeline.service.js";

export interface RecommendationSchedulerOptions {
  /** Cron expression. Default: every 5 minutes. */
  cronExpression?: string;
  /** When false, start() is a no-op. Default: true. */
  enabled?: boolean;
  /** Optional dark store scope for scheduled runs. */
  darkStoreId?: string;
}

/**
 * Cron B — Recommendation Engine.
 * Periodically reads Mongo signals and regenerates recommendations.
 * Independent of SQS / event simulator.
 */
export class RecommendationScheduler {
  private task: ScheduledTask | null = null;
  private running = false;
  private readonly cronExpression: string;
  private readonly enabled: boolean;
  private readonly darkStoreId?: string;

  constructor(options: RecommendationSchedulerOptions = {}) {
    this.cronExpression = options.cronExpression ?? "*/5 * * * *";
    this.enabled = options.enabled ?? true;
    this.darkStoreId = options.darkStoreId;
  }

  start(): void {
    if (!this.enabled) {
      console.log("[RecommendationScheduler] Disabled — skipping start");
      return;
    }

    if (this.task) {
      return;
    }

    if (!cron.validate(this.cronExpression)) {
      throw new Error(
        `Invalid recommendation cron expression: ${this.cronExpression}`,
      );
    }

    this.task = cron.schedule(this.cronExpression, () => {
      void this.tick();
    });

    console.log(
      `[RecommendationScheduler] Started (${this.cronExpression})`,
    );
  }

  stop(): void {
    if (!this.task) {
      return;
    }

    this.task.stop();
    this.task = null;
    console.log("[RecommendationScheduler] Stopped");
  }

  /** Exposed for tests and manual one-shot runs. */
  async tick(): Promise<void> {
    if (this.running) {
      console.log(
        "[RecommendationScheduler] Previous run still in progress — skipping",
      );
      return;
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      const result = await recommendationPipelineService.generate({
        darkStoreId: this.darkStoreId,
      });

      console.log(
        JSON.stringify({
          action: "RecommendationCronCompleted",
          darkStoreId: result.darkStoreId,
          processed: result.processed,
          created: result.created,
          failed: result.failed,
          durationMs: Date.now() - startedAt,
        }),
      );
    } catch (error) {
      console.error(
        "[RecommendationScheduler] Run failed:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      this.running = false;
    }
  }
}

export const recommendationScheduler = new RecommendationScheduler();
