export interface EventSchedulerOptions {
  eventsPerSecond: number;
  batchSize?: number;
}

export interface EventSchedulerPort {
  start(): Promise<void>;
  stop(): Promise<void>;
  waitUntilComplete(): Promise<void>;
  isRunning(): boolean;
}
