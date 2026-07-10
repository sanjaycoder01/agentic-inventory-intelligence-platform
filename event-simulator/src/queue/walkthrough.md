# SQS Integration Walkthrough

We have integrated AWS SQS as a swappable transport mechanism for the Event Simulator without altering generator logic or scheduler internals.

## Architecture

```
Event Simulator
  │
Scenario Generator
  │
Event Pipeline
  │
Queue Factory (Memory | AWS SQS FIFO)
  │
Amazon SQS FIFO
  │
Consumer Worker
  │
Event Dispatcher
  │
Backend Client
  │
Backend REST APIs
  │
MongoDB
```

## Queue Configuration

The producer and consumer use the environment settings in `.env`:

- `QUEUE_PROVIDER=SQS`
- `AWS_REGION`
- `SQS_QUEUE_URL`
- `SQS_DLQ_URL`
- `SQS_MAX_BATCH_SIZE=10`
- `SQS_WAIT_TIME_SECONDS=20`
- `SQS_VISIBILITY_TIMEOUT=30`

## AWS Setup

- Create an SQS FIFO queue named `inventory-events.fifo`.
- Create a matching DLQ queue, typically `inventory-events-dlq.fifo`.
- Configure the queue to use content-based deduplication or provide explicit deduplication IDs from the simulator.
- Set the DLQ on the primary queue with `maxReceiveCount=5`.

## Local Development

- Run the simulator normally to publish events.
- Start the consumer with `npm run queue:consumer`.
- Verify the queue contents with `aws sqs receive-message` or the AWS Console.
- Switch between memory and SQS by changing `QUEUE_PROVIDER`.

## Production Deployment

- Keep the consumer process running as a background service.
- Monitor the queue length and CloudWatch metrics for messages sent, received, deleted, visible, in-flight, and DLQ items.
- Use the structured logs emitted by the publisher and consumer for traceability.
- Use the health service to surface provider, reachability, queue URL, queue depth, in-flight depth, consumer status, and last poll time.

## Failure Recovery

- Native SQS retries are used for transient processing failures.
- Messages are deleted only after successful dispatch.
- Duplicate deliveries are skipped safely through dispatcher idempotency keyed by `eventId`.
- Permanently failing messages are routed to the DLQ by the AWS Redrive Policy after the configured receive count is exceeded.

## Verification Steps

1. Start the consumer worker.
2. Run the simulator.
3. Confirm events appear in SQS.
4. Confirm the consumer dispatches them to the backend.
5. Confirm the queue drains and MongoDB updates reflect the workflow.
6. Confirm graceful shutdown leaves the worker in a clean state without dropping active work.
