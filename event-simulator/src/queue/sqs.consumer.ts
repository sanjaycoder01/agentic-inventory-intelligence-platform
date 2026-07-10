import { sqsClientWrapper } from './sqs.client.js';
import { EventDispatcher } from '../dispatch/event.dispatcher.js';
import { SimulatorEvent } from '../generators/simulator-event.types.js';
import { logQueueEvent } from './queue.logging.js';
import { queueMetricsService } from './queue.metrics.js';

export class SqsConsumer {
  constructor(private readonly dispatcher: EventDispatcher) {}

  async pollAndProcess(): Promise<number> {
    const messages = await sqsClientWrapper.receiveMessages();
    if (messages.length === 0) return 0;

    for (const msg of messages) {
      if (!msg.Body || !msg.ReceiptHandle) continue;
      try {
        const event: SimulatorEvent = JSON.parse(msg.Body);
        queueMetricsService.recordReceived();
        logQueueEvent('Received', { eventId: event.eventId, messageId: msg.MessageId, simulationRunId: event.simulationRunId, eventType: event.type });

        const results = await this.dispatcher.dispatch(event as any);
        const success = results.every(r => r.result.success);

        if (success) {
          await sqsClientWrapper.deleteMessage(msg.ReceiptHandle);
          queueMetricsService.recordProcessed();
          queueMetricsService.recordDeleted();
          logQueueEvent('Deleted', { eventId: event.eventId, messageId: msg.MessageId, simulationRunId: event.simulationRunId, eventType: event.type });
        } else {
          queueMetricsService.recordFailed();
          queueMetricsService.recordRetry();
          logQueueEvent('Failed', { eventId: event.eventId, messageId: msg.MessageId, simulationRunId: event.simulationRunId, eventType: event.type, details: 'dispatch failed' });
        }
      } catch (err: any) {
        queueMetricsService.recordFailed();
        queueMetricsService.recordRetry();
        logQueueEvent('Failed', { eventId: undefined, messageId: msg.MessageId, simulationRunId: undefined, eventType: undefined, details: err.message });
      }
    }
    return messages.length;
  }
}
