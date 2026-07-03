import type { SimulatorEvent } from "../generators/simulator-event.types.js";
import type { EventPipeline } from "./pipeline.types.js";

/**
 * FIFO in-memory queue for simulator events.
 *
 * Used between generators and the dispatcher so large scenario bursts
 * (e.g. 12,400 events) are released gradually instead of hitting the
 * backend at once.
 */
export class MemoryEventPipeline<TEvent = SimulatorEvent>
  implements EventPipeline<TEvent>
{
  private readonly queue: TEvent[] = [];

  enqueue(event: TEvent): void {
    this.queue.push(event);
  }

  enqueueMany(events: TEvent[]): void {
    if (events.length === 0) {
      return;
    }

    this.queue.push(...events);
  }

  dequeue(): TEvent | undefined {
    return this.queue.shift();
  }

  dequeueBatch(size: number): TEvent[] {
    if (size <= 0) {
      return [];
    }

    return this.queue.splice(0, size);
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue.length = 0;
  }
}

export function createMemoryEventPipeline<
  TEvent = SimulatorEvent,
>(): EventPipeline<TEvent> {
  return new MemoryEventPipeline<TEvent>();
}
