import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUEUE_DIR = path.join(__dirname, 'src/queue');

const files = [
  {
    path: path.join(QUEUE_DIR, 'queue.types.ts'),
    content: "import { SimulatorEvent } from '../generators/simulator-event.types.js';\n\n" +
      "export interface EventQueue<T = SimulatorEvent> {\n" +
      "  publish(event: T): Promise<void>;\n" +
      "  publishBatch(events: T[]): Promise<void>;\n" +
      "  receive(batchSize?: number): Promise<T[]>;\n" +
      "  delete(receiptHandle: string): Promise<void>;\n" +
      "  size(): Promise<number>;\n" +
      "}\n"
  },
  {
    path: path.join(QUEUE_DIR, 'queue.constants.ts'),
    content: "export const QUEUE_PROVIDERS = {\n" +
      "  MEMORY: 'MEMORY',\n" +
      "  SQS: 'SQS',\n" +
      "};\n"
  },
  {
    path: path.join(QUEUE_DIR, 'queue.config.ts'),
    content: "export const QUEUE_CONFIG = {\n" +
      "  region: process.env.AWS_REGION || 'us-east-1',\n" +
      "  accessKeyId: process.env.AWS_ACCESS_KEY_ID,\n" +
      "  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,\n" +
      "  queueUrl: process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/simulator-queue.fifo',\n" +
      "  dlqUrl: process.env.SQS_DLQ_URL,\n" +
      "  maxBatchSize: parseInt(process.env.SQS_MAX_BATCH_SIZE || '10', 10),\n" +
      "  waitTimeSeconds: parseInt(process.env.SQS_WAIT_TIME_SECONDS || '20', 10),\n" +
      "  visibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT || '30', 10),\n" +
      "  provider: process.env.QUEUE_PROVIDER || 'MEMORY',\n" +
      "};\n"
  },
  {
    path: path.join(QUEUE_DIR, 'sqs.types.ts'),
    content: "export interface SQSMessageEnvelope<T> {\n" +
      "  messageId: string;\n" +
      "  receiptHandle: string;\n" +
      "  body: T;\n" +
      "  attributes?: Record<string, string>;\n" +
      "}\n"
  },
  {
    path: path.join(QUEUE_DIR, 'sqs.constants.ts'),
    content: "export const SQS_CONSTANTS = {\n" +
      "  MESSAGE_GROUP_ID: 'SimulatorGroup',\n" +
      "};\n"
  },
  {
    path: path.join(QUEUE_DIR, 'sqs.client.ts'),
    content: "import { SQSClient, SendMessageCommand, SendMessageBatchCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';\n" +
      "import { QUEUE_CONFIG } from './queue.config.js';\n\n" +
      "export class SqsClientWrapper {\n" +
      "  private client: SQSClient;\n\n" +
      "  constructor() {\n" +
      "    const config: any = { region: QUEUE_CONFIG.region };\n" +
      "    if (QUEUE_CONFIG.accessKeyId && QUEUE_CONFIG.secretAccessKey) {\n" +
      "      config.credentials = {\n" +
      "        accessKeyId: QUEUE_CONFIG.accessKeyId,\n" +
      "        secretAccessKey: QUEUE_CONFIG.secretAccessKey,\n" +
      "      };\n" +
      "    }\n" +
      "    this.client = new SQSClient(config);\n" +
      "  }\n\n" +
      "  getClient() {\n" +
      "    return this.client;\n" +
      "  }\n\n" +
      "  async sendMessage(body: string, deduplicationId: string, groupId: string) {\n" +
      "    const command = new SendMessageCommand({\n" +
      "      QueueUrl: QUEUE_CONFIG.queueUrl,\n" +
      "      MessageBody: body,\n" +
      "      MessageDeduplicationId: deduplicationId,\n" +
      "      MessageGroupId: groupId,\n" +
      "    });\n" +
      "    return this.client.send(command);\n" +
      "  }\n\n" +
      "  async sendMessageBatch(entries: Array<{ id: string; body: string; deduplicationId: string; groupId: string }>) {\n" +
      "    const command = new SendMessageBatchCommand({\n" +
      "      QueueUrl: QUEUE_CONFIG.queueUrl,\n" +
      "      Entries: entries.map(e => ({\n" +
      "        Id: e.id,\n" +
      "        MessageBody: e.body,\n" +
      "        MessageDeduplicationId: e.deduplicationId,\n" +
      "        MessageGroupId: e.groupId,\n" +
      "      })),\n" +
      "    });\n" +
      "    return this.client.send(command);\n" +
      "  }\n\n" +
      "  async receiveMessages(maxMessages = 10) {\n" +
      "    const command = new ReceiveMessageCommand({\n" +
      "      QueueUrl: QUEUE_CONFIG.queueUrl,\n" +
      "      MaxNumberOfMessages: maxMessages,\n" +
      "      WaitTimeSeconds: QUEUE_CONFIG.waitTimeSeconds,\n" +
      "      VisibilityTimeout: QUEUE_CONFIG.visibilityTimeout,\n" +
      "      AttributeNames: ['All'],\n" +
      "      MessageAttributeNames: ['All'],\n" +
      "    });\n" +
      "    const res = await this.client.send(command);\n" +
      "    return res.Messages || [];\n" +
      "  }\n\n" +
      "  async deleteMessage(receiptHandle: string) {\n" +
      "    const command = new DeleteMessageCommand({\n" +
      "      QueueUrl: QUEUE_CONFIG.queueUrl,\n" +
      "      ReceiptHandle: receiptHandle,\n" +
      "      });\n" +
      "    return this.client.send(command);\n" +
      "  }\n\n" +
      "  async getQueueLength() {\n" +
      "    const command = new GetQueueAttributesCommand({\n" +
      "      QueueUrl: QUEUE_CONFIG.queueUrl,\n" +
      "      AttributeNames: ['ApproximateNumberOfMessages'],\n" +
      "    });\n" +
      "    const res = await this.client.send(command);\n" +
      "    return parseInt(res.Attributes?.ApproximateNumberOfMessages || '0', 10);\n" +
      "  }\n" +
      "}\n\n" +
      "export const sqsClientWrapper = new SqsClientWrapper();\n"
  },
  {
    path: path.join(QUEUE_DIR, 'sqs.publisher.ts'),
    content: "import { sqsClientWrapper } from './sqs.client.js';\n" +
      "import { SimulatorEvent } from '../generators/simulator-event.types.js';\n" +
      "import { randomUUID } from 'node:crypto';\n\n" +
      "export class SqsPublisher {\n" +
      "  async publish(event: SimulatorEvent): Promise<void> {\n" +
      "    const eventId = event.eventId || randomUUID();\n" +
      "    event.eventId = eventId;\n" +
      "    const body = JSON.stringify(event);\n" +
      "    const groupId = event.simulationRunId + ':' + (event.payload as any)?.sessionId || 'global';\n" +
      "    await sqsClientWrapper.sendMessage(body, eventId, groupId);\n" +
      "    console.log(`[Published] simulationRunId=${event.simulationRunId} eventType=${event.type} eventId=${eventId}`);\n" +
      "  }\n\n" +
      "  async publishBatch(events: SimulatorEvent[]): Promise<void> {\n" +
      "    if (events.length === 0) return;\n" +
      "    const entries = events.map(event => {\n" +
      "      const eventId = event.eventId || randomUUID();\n" +
      "      event.eventId = eventId;\n" +
      "      const body = JSON.stringify(event);\n" +
      "      const groupId = event.simulationRunId + ':' + (event.payload as any)?.sessionId || 'global';\n" +
      "      return {\n" +
      "        id: randomUUID(),\n" +
      "        body,\n" +
      "        deduplicationId: eventId,\n" +
      "        groupId,\n" +
      "      };\n" +
      "    });\n" +
      "    await sqsClientWrapper.sendMessageBatch(entries);\n" +
      "    console.log(`[Published Batch] size=${events.length}`);\n" +
      "  }\n" +
      "}\n\n" +
      "export const sqsPublisher = new SqsPublisher();\n"
  },
  {
    path: path.join(QUEUE_DIR, 'sqs.consumer.ts'),
    content: "import { sqsClientWrapper } from './sqs.client.js';\n" +
      "import { EventDispatcher } from '../dispatch/event.dispatcher.js';\n" +
      "import { SimulatorEvent } from '../generators/simulator-event.types.js';\n\n" +
      "export class SqsConsumer {\n" +
      "  constructor(private readonly dispatcher: EventDispatcher) {}\n\n" +
      "  async pollAndProcess(): Promise<number> {\n" +
      "    const messages = await sqsClientWrapper.receiveMessages();\n" +
      "    if (messages.length === 0) return 0;\n\n" +
      "    for (const msg of messages) {\n" +
      "      if (!msg.Body || !msg.ReceiptHandle) continue;\n" +
      "      try {\n" +
      "        const event: SimulatorEvent = JSON.parse(msg.Body);\n" +
      "        console.log(`[Received] messageId=${msg.MessageId} eventType=${event.type}`);\n" +
      "        const results = await this.dispatcher.dispatch(event);\n" +
      "        const success = results.every(r => r.result.success);\n" +
      "        if (success) {\n" +
      "          await sqsClientWrapper.deleteMessage(msg.ReceiptHandle);\n" +
      "          console.log(`[Deleted] messageId=${msg.MessageId} eventId=${event.eventId}`);\n" +
      "        } else {\n" +
      "          console.warn(`[Retry] messageId=${msg.MessageId} - dispatch failed`);\n" +
      "        }\n" +
      "      } catch (err: any) {\n" +
      "        console.error(`[Error] Failed to process messageId=${msg.MessageId}: ${err.message}`);\n" +
      "      }\n" +
      "    }\n" +
      "    return messages.length;\n" +
      "  }\n" +
      "}\n"
  },
  {
    path: path.join(QUEUE_DIR, 'queue.factory.ts'),
    content: "import { EventPipeline } from '../pipeline/pipeline.types.js';\n" +
      "import { MemoryEventPipeline } from '../pipeline/event.pipeline.js';\n" +
      "import { sqsPublisher } from './sqs.publisher.js';\n" +
      "import { QUEUE_CONFIG } from './queue.config.js';\n" +
      "import { SimulatorEvent } from '../generators/simulator-event.types.js';\n\n" +
      "export class SqsEventPipelineWrapper implements EventPipeline<SimulatorEvent> {\n" +
      "  enqueue(event: SimulatorEvent): void {\n" +
      "    sqsPublisher.publish(event).catch(console.error);\n" +
      "  }\n\n" +
      "  enqueueMany(events: SimulatorEvent[]): void {\n" +
      "    sqsPublisher.publishBatch(events).catch(console.error);\n" +
      "  }\n\n" +
      "  dequeue(): SimulatorEvent | undefined {\n" +
      "    return undefined;\n" +
      "  }\n\n" +
      "  dequeueBatch(): SimulatorEvent[] {\n" +
      "    return [];\n" +
      "  }\n\n" +
      "  size(): number {\n" +
      "    return 0;\n" +
      "  }\n\n" +
      "  clear(): void {}\n" +
      "}\n\n" +
      "export const queueFactory = {\n" +
      "  createPipeline: (): EventPipeline<SimulatorEvent> => {\n" +
      "    if (QUEUE_CONFIG.provider === 'SQS') {\n" +
      "      return new SqsEventPipelineWrapper();\n" +
      "    }\n" +
      "    return new MemoryEventPipeline();\n" +
      "  }\n" +
      "};\n"
  },
  {
    path: path.join(QUEUE_DIR, 'worker.ts'),
    content: "import 'dotenv/config';\n" +
      "import { SqsConsumer } from './sqs.consumer.js';\n" +
      "import { EventDispatcher } from '../dispatch/event.dispatcher.js';\n" +
      "import { RestBackendClient } from '../dispatch/rest-backend.client.js';\n\n" +
      "const backendClient = new RestBackendClient();\n" +
      "const dispatcher = new EventDispatcher(backendClient);\n" +
      "const consumer = new SqsConsumer(dispatcher);\n\n" +
      "let running = true;\n\n" +
      "async function main() {\n" +
      "  console.log('SQS Consumer Worker started. Polling messages...');\n" +
      "  while (running) {\n" +
      "    try {\n" +
      "      const processed = await consumer.pollAndProcess();\n" +
      "      if (processed === 0) {\n" +
      "        await new Promise(resolve => setTimeout(resolve, 1000));\n" +
      "      }\n" +
      "    } catch (err: any) {\n" +
      "      console.error('Worker loop error:', err.message);\n" +
      "      await new Promise(resolve => setTimeout(resolve, 5000));\n" +
      "    }\n" +
      "  }\n" +
      "  console.log('Worker shut down gracefully.');\n" +
      "}\n\n" +
      "process.on('SIGTERM', () => {\n" +
      "  console.log('SIGTERM received. Stopping worker...');\n" +
      "  running = false;\n" +
      "});\n" +
      "process.on('SIGINT', () => {\n" +
      "  console.log('SIGINT received. Stopping worker...');\n" +
      "  running = false;\n" +
      "});\n\n" +
      "main().catch(console.error);\n"
  },
  {
    path: path.join(QUEUE_DIR, 'sqs.test.ts'),
    content: "import { describe, it, expect, vi, beforeEach } from 'vitest';\n" +
      "import { sqsPublisher } from './sqs.publisher.js';\n" +
      "import { SqsConsumer } from './sqs.consumer.js';\n" +
      "import { sqsClientWrapper } from './sqs.client.js';\n" +
      "import { EventDispatcher } from '../dispatch/event.dispatcher.js';\n\n" +
      "vi.mock('./sqs.client.js', () => ({\n" +
      "  sqsClientWrapper: {\n" +
      "    sendMessage: vi.fn().mockResolvedValue({}),\n" +
      "    sendMessageBatch: vi.fn().mockResolvedValue({}),\n" +
      "    receiveMessages: vi.fn().mockResolvedValue([]),\n" +
      "    deleteMessage: vi.fn().mockResolvedValue({}),\n" +
      "  }\n" +
      "}));\n\n" +
      "describe('SQS Queue Transport', () => {\n" +
      "  beforeEach(() => {\n" +
      "    vi.clearAllMocks();\n" +
      "  });\n\n" +
      "  it('should publish a single event successfully', async () => {\n" +
      "    const spy = vi.spyOn(sqsClientWrapper, 'sendMessage');\n" +
      "    await sqsPublisher.publish({\n" +
      "      simulationRunId: 'run-1',\n" +
      "      type: 'CART',\n" +
      "      payload: { sessionId: 'cust-1' },\n" +
      "      createdAt: new Date(),\n" +
      "    });\n" +
      "    expect(spy).toHaveBeenCalled();\n" +
      "  });\n\n" +
      "  it('should publish events in batch', async () => {\n" +
      "    const spy = vi.spyOn(sqsClientWrapper, 'sendMessageBatch');\n" +
      "    await sqsPublisher.publishBatch([\n" +
      "      { simulationRunId: 'run-1', type: 'CART', payload: { sessionId: 'cust-1' }, createdAt: new Date() },\n" +
      "      { simulationRunId: 'run-1', type: 'ORDER', payload: { sessionId: 'cust-1' }, createdAt: new Date() },\n" +
      "    ]);\n" +
      "    expect(spy).toHaveBeenCalled();\n" +
      "  });\n\n" +
      "  it('should process and delete messages in consumer', async () => {\n" +
      "    const mockMsg = {\n" +
      "      MessageId: 'msg-123',\n" +
      "      ReceiptHandle: 'handle-123',\n" +
      "      Body: JSON.stringify({ eventId: 'evt-1', simulationRunId: 'run-1', type: 'CART', payload: {} }),\n" +
      "    };\n" +
      "    vi.spyOn(sqsClientWrapper, 'receiveMessages').mockResolvedValue([mockMsg] as any);\n" +
      "    const deleteSpy = vi.spyOn(sqsClientWrapper, 'deleteMessage');\n\n" +
      "    const mockDispatcher = {\n" +
      "      dispatch: vi.fn().mockResolvedValue([{ result: { success: true } }]),\n" +
      "    } as any;\n\n" +
      "    const consumer = new SqsConsumer(mockDispatcher);\n" +
      "    const processed = await consumer.pollAndProcess();\n" +
      "    expect(processed).toBe(1);\n" +
      "    expect(deleteSpy).toHaveBeenCalledWith('handle-123');\n" +
      "  });\n" +
      "});\n"
  }
];

for (const file of files) {
  const dir = path.dirname(file.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file.path, file.content, 'utf-8');
  console.log('Created: ' + file.path);
}
