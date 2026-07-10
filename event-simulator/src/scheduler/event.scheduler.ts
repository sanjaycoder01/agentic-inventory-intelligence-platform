import type { EventDispatcher } from "../dispatch/event.dispatcher.js";
import type { DispatchableSimulatorEvent } from "../dispatch/event.dispatcher.js";
import type { EventPipeline } from "../pipeline/pipeline.types.js";
import type { EventSchedulerOptions, EventSchedulerPort } from "./scheduler.types.js";

export class EventScheduler implements EventSchedulerPort {
  private running = false;
  private loopPromise?: Promise<void>;
  private readonly batchSize: number;
  private readonly tickIntervalMs: number;

  constructor(
    private readonly pipeline: EventPipeline<DispatchableSimulatorEvent>,
    private readonly dispatcher: EventDispatcher,
    options: EventSchedulerOptions,
  ) {
    const eventsPerSecond = Math.max(1, options.eventsPerSecond);
    this.batchSize = Math.max(1, options.batchSize ?? 1);
    this.tickIntervalMs = (this.batchSize / eventsPerSecond) * 1000;
  }

  async start(): Promise<void> {
    if (this.loopPromise) {
      return;
    }

    this.running = true;
    this.loopPromise = this.runLoop();
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.loopPromise;
  }

  async waitUntilComplete(): Promise<void> {
    await this.loopPromise;
    if (typeof (this.pipeline as any).waitForAll === 'function') {
      await (this.pipeline as any).waitForAll();
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private async runLoop(): Promise<void> {
    try {
      while (this.running && this.pipeline.size() > 0) {
        const events = this.pipeline.dequeueBatch(this.batchSize);

        if (events.length === 0) {
          await sleep(10);
          continue;
        }

        await this.dispatcher.dispatch(events);

        if (this.pipeline.size() > 0) {
          await sleep(this.tickIntervalMs);
        }
      }
    } finally {
      this.running = false;
    }
  }
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}
