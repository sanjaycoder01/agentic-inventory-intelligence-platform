import { QUEUE_CONFIG } from './queue.config.js';
import { QUEUE_PROVIDERS } from './queue.constants.js';
import { sqsClientWrapper } from './sqs.client.js';

export interface QueueHealthStatus {
  provider: string;
  queueReachability: 'ok' | 'unavailable';
  queueUrl: string | undefined;
  approxQueueLength: number;
  approxInFlightMessages: number;
  approxDlqLength: number;
  consumerRunning: boolean;
  lastPollTime: string | null;
}

export async function getQueueHealth(consumerRunning = true): Promise<QueueHealthStatus> {
  try {
    const attributes = await sqsClientWrapper.getQueueAttributes();
    return {
      provider: QUEUE_CONFIG.provider?.toUpperCase() || QUEUE_PROVIDERS.MEMORY,
      queueReachability: 'ok',
      queueUrl: QUEUE_CONFIG.queueUrl,
      approxQueueLength: attributes.queueLength,
      approxInFlightMessages: attributes.inFlight,
      approxDlqLength: attributes.dlqLength,
      consumerRunning,
      lastPollTime: new Date().toISOString(),
    };
  } catch {
    return {
      provider: QUEUE_CONFIG.provider?.toUpperCase() || QUEUE_PROVIDERS.MEMORY,
      queueReachability: 'unavailable',
      queueUrl: QUEUE_CONFIG.queueUrl,
      approxQueueLength: 0,
      approxInFlightMessages: 0,
      approxDlqLength: 0,
      consumerRunning,
      lastPollTime: null,
    };
  }
}
