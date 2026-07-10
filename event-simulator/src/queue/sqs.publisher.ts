import { sqsClientWrapper } from './sqs.client.js';
import { QUEUE_CONFIG } from './queue.config.js';
import { SimulatorEvent } from '../generators/simulator-event.types.js';
import { randomUUID } from 'node:crypto';
import { logQueueEvent } from './queue.logging.js';
import { queueMetricsService } from './queue.metrics.js';

export class SqsPublisher {
  private buildEntry(event: SimulatorEvent) {
    const eventId = event.eventId || randomUUID();
    event.eventId = eventId;
    const body = JSON.stringify(event);
    const customerId = (event.payload as Record<string, unknown>)?.customerId || (event.payload as Record<string, unknown>)?.sessionId || 'global';
    const groupId = `${event.simulationRunId}:${customerId}`;
    return {
      body,
      deduplicationId: eventId,
      groupId,
      eventId,
    };
  }

  async publish(event: SimulatorEvent): Promise<void> {
    const entry = this.buildEntry(event);
    const response = await sqsClientWrapper.sendMessage(entry.body, entry.deduplicationId, entry.groupId);
    queueMetricsService.recordPublished();
    logQueueEvent('Published', { eventId: entry.eventId, messageId: response.MessageId || 'n/a', simulationRunId: event.simulationRunId, eventType: event.type });
  }

  async publishBatch(events: SimulatorEvent[]): Promise<void> {
    if (events.length === 0) return;

    const batchSize = QUEUE_CONFIG.maxBatchSize || 10;
    for (let index = 0; index < events.length; index += batchSize) {
      const chunk = events.slice(index, index + batchSize);
      const entries = chunk.map(event => {
        const entry = this.buildEntry(event);
        return {
          id: randomUUID(),
          body: entry.body,
          deduplicationId: entry.deduplicationId,
          groupId: entry.groupId,
        };
      });

      const response = await sqsClientWrapper.sendMessageBatch(entries);
      queueMetricsService.recordPublished(entries.length);
      entries.forEach((entry, entryIndex) => {
        const sourceEvent = chunk[entryIndex];
        const messageId = response.Successful?.[entryIndex]?.MessageId || 'n/a';
        logQueueEvent('Published', { eventId: sourceEvent.eventId, messageId, simulationRunId: sourceEvent.simulationRunId, eventType: sourceEvent.type });
      });
    }
  }
}

export const sqsPublisher = new SqsPublisher();
