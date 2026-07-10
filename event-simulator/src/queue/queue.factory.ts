import { EventPipeline } from '../pipeline/pipeline.types.js';
import { MemoryEventPipeline } from '../pipeline/event.pipeline.js';
import { sqsPublisher } from './sqs.publisher.js';
import { QUEUE_CONFIG } from './queue.config.js';
import { QUEUE_PROVIDERS } from './queue.constants.js';
import { SimulatorEvent } from '../generators/simulator-event.types.js';

export class SqsEventPipelineWrapper implements EventPipeline<SimulatorEvent> {
  private pendingPromises: Promise<void>[] = [];

  enqueue(event: SimulatorEvent): void {
    const p = sqsPublisher.publish(event).catch(console.error);
    this.pendingPromises.push(p);
  }

  enqueueMany(events: SimulatorEvent[]): void {
    const p = sqsPublisher.publishBatch(events).catch(console.error);
    this.pendingPromises.push(p);
  }

  async waitForAll(): Promise<void> {
    await Promise.all(this.pendingPromises);
    this.pendingPromises = [];
  }

  dequeue(): SimulatorEvent | undefined {
    return undefined;
  }

  dequeueBatch(): SimulatorEvent[] {
    return [];
  }

  size(): number {
    return 0;
  }

  clear(): void {}
}

export const queueFactory = {
  createPipeline: (): EventPipeline<SimulatorEvent> => {
    if (QUEUE_CONFIG.provider?.toUpperCase() === QUEUE_PROVIDERS.SQS) {
      return new SqsEventPipelineWrapper();
    }
    return new MemoryEventPipeline();
  }
};
