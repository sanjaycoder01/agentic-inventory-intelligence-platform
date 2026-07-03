/**
 * Generic event queue contract for the simulator.
 *
 * Generators enqueue domain events; a scheduler (later) dequeues them at a
 * controlled rate before the dispatcher sends them to the backend.
 *
 * The default in-memory implementation can be swapped for AWS SQS without
 * changing generators, dispatchers, or the backend client.
 */
export interface EventPipeline<TEvent> {
  /** Add a single event to the tail of the queue. */
  enqueue(event: TEvent): void;

  /** Add multiple events, preserving generator order. */
  enqueueMany(events: TEvent[]): void;

  /** Remove and return the oldest event, or undefined when empty. */
  dequeue(): TEvent | undefined;

  /** Remove and return up to `size` events in FIFO order. */
  dequeueBatch(size: number): TEvent[];

  /** Number of events currently waiting in the queue. */
  size(): number;

  /** Remove all queued events. */
  clear(): void;
}
