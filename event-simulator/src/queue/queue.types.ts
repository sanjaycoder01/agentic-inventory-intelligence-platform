import { SimulatorEvent } from '../generators/simulator-event.types.js';

export interface EventQueue<T = SimulatorEvent> {
  publish(event: T): Promise<void>;
  publishBatch(events: T[]): Promise<void>;
  receive(batchSize?: number): Promise<T[]>;
  delete(receiptHandle: string): Promise<void>;
  size(): Promise<number>;
}
