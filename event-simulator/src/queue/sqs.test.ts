import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sqsPublisher } from './sqs.publisher.js';
import { SqsConsumer } from './sqs.consumer.js';
import { sqsClientWrapper } from './sqs.client.js';
import { EventDispatcher } from '../dispatch/event.dispatcher.js';
import { getQueueHealth } from './queue.health.js';
import { queueMetricsService } from './queue.metrics.js';


vi.mock('./sqs.client.js', () => ({
  sqsClientWrapper: {
    sendMessage: vi.fn().mockResolvedValue({}),
    sendMessageBatch: vi.fn().mockResolvedValue({}),
    receiveMessages: vi.fn().mockResolvedValue([]),
    deleteMessage: vi.fn().mockResolvedValue({}),
    getQueueLength: vi.fn().mockResolvedValue(0),
    getQueueAttributes: vi.fn().mockResolvedValue({ queueLength: 0, inFlight: 0, dlqLength: 0 }),
  }
}));

describe('SQS Queue Transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should publish a single event with FIFO metadata', async () => {
    const spy = vi.spyOn(sqsClientWrapper, 'sendMessage');
    const event = {
      eventId: 'evt-1',
      simulationRunId: 'run-1',
      type: 'CART' as const,
      payload: { sessionId: 'cust-1' },
      createdAt: new Date(),
    };

    await sqsPublisher.publish(event);

    const [body, deduplicationId, groupId] = spy.mock.calls[0];
    expect(spy).toHaveBeenCalled();
    expect(deduplicationId).toBe(event.eventId);
    expect(groupId).toBe('run-1:cust-1');
    expect(JSON.parse(body)).toMatchObject({ simulationRunId: 'run-1', type: 'CART' });
  });

  it('should split large batches into chunks of 10', async () => {
    const spy = vi.spyOn(sqsClientWrapper, 'sendMessageBatch');
    const events = Array.from({ length: 12 }, (_, index) => ({
      simulationRunId: 'run-1',
      type: 'CART' as const,
      payload: { sessionId: `cust-${index}` },
      createdAt: new Date(),
    }));

    await sqsPublisher.publishBatch(events);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0]).toHaveLength(10);
    expect(spy.mock.calls[1][0]).toHaveLength(2);
  });

  it('should create an SQS pipeline when the provider is set to SQS', async () => {
    process.env.QUEUE_PROVIDER = 'SQS';
    vi.resetModules();

    const { queueFactory } = await import('./queue.factory.js');

    expect(queueFactory.createPipeline().constructor.name).toBe('SqsEventPipelineWrapper');
  });

  it('should process and delete messages in consumer', async () => {
    const mockMsg = {
      MessageId: 'msg-123',
      ReceiptHandle: 'handle-123',
      Body: JSON.stringify({ eventId: 'evt-1', simulationRunId: 'run-1', type: 'CART', payload: {} }),
    };
    vi.spyOn(sqsClientWrapper, 'receiveMessages').mockResolvedValue([mockMsg] as any);
    const deleteSpy = vi.spyOn(sqsClientWrapper, 'deleteMessage');

    const mockDispatcher = {
      dispatch: vi.fn().mockResolvedValue([{ result: { success: true } }]),
    } as any;

    const consumer = new SqsConsumer(mockDispatcher);
    const processed = await consumer.pollAndProcess();
    expect(processed).toBe(1);
    expect(deleteSpy).toHaveBeenCalledWith('handle-123');
  });

  it('should not delete a message when dispatch fails', async () => {
    const mockMsg = {
      MessageId: 'msg-456',
      ReceiptHandle: 'handle-456',
      Body: JSON.stringify({ eventId: 'evt-2', simulationRunId: 'run-2', type: 'ORDER', payload: {} }),
    };
    vi.spyOn(sqsClientWrapper, 'receiveMessages').mockResolvedValue([mockMsg] as any);
    const deleteSpy = vi.spyOn(sqsClientWrapper, 'deleteMessage');

    const mockDispatcher = {
      dispatch: vi.fn().mockResolvedValue([{ result: { success: false, error: 'backend error' } }]),
    } as any;

    const consumer = new SqsConsumer(mockDispatcher);
    const processed = await consumer.pollAndProcess();

    expect(processed).toBe(1);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should skip duplicate event ids in the dispatcher', async () => {
    const backendClient = {
      sendCartEvent: vi.fn().mockResolvedValue({ success: true, status: 200, response: { ok: true } }),
      sendOrder: vi.fn().mockResolvedValue({ success: true, status: 200, response: { ok: true } }),
      sendRating: vi.fn().mockResolvedValue({ success: true, status: 200, response: { ok: true } }),
    };

    const dispatcher = new EventDispatcher(backendClient as any);
    const event = {
      eventId: 'duplicate-evt',
      simulationRunId: 'run-3',
      type: 'CART' as const,
      payload: { sessionId: 'cust-3' },
      createdAt: new Date(),
    };

    const results = await dispatcher.dispatch([event, event]);

    expect(results).toHaveLength(2);
    expect(backendClient.sendCartEvent).toHaveBeenCalledTimes(1);
  });

  it('should report queue health details', async () => {
    vi.spyOn(sqsClientWrapper as any, 'getQueueAttributes').mockResolvedValue({ queueLength: 4, inFlight: 2, dlqLength: 1 });

    const health = await getQueueHealth(true);

    expect(health.provider).toBe('SQS');
    expect(health.queueReachability).toBe('ok');
    expect(health.consumerRunning).toBe(true);
    expect(health.approxQueueLength).toBe(4);
    expect(health.approxInFlightMessages).toBe(2);
    expect(health.approxDlqLength).toBe(1);
  });

  it('should track queue metrics counters', () => {
    queueMetricsService.reset();
    queueMetricsService.recordPublished(2);
    queueMetricsService.recordReceived(2);
    queueMetricsService.recordProcessed(1);
    queueMetricsService.recordFailed(1);
    queueMetricsService.recordDeleted(1);
    queueMetricsService.recordRetry(1);
    queueMetricsService.recordDlq(1);

    const snapshot = queueMetricsService.getSnapshot();

    expect(snapshot.published).toBe(2);
    expect(snapshot.received).toBe(2);
    expect(snapshot.processed).toBe(1);
    expect(snapshot.failed).toBe(1);
    expect(snapshot.deleted).toBe(1);
    expect(snapshot.retryCount).toBe(1);
    expect(snapshot.dlqCount).toBe(1);
  });
});
