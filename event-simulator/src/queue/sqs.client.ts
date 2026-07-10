import { SQSClient, SendMessageCommand, SendMessageBatchCommand, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { QUEUE_CONFIG } from './queue.config.js';

export class SqsClientWrapper {
  private client: SQSClient;

  constructor() {
    const config: any = { region: QUEUE_CONFIG.region };
    if (QUEUE_CONFIG.accessKeyId && QUEUE_CONFIG.secretAccessKey) {
      config.credentials = {
        accessKeyId: QUEUE_CONFIG.accessKeyId,
        secretAccessKey: QUEUE_CONFIG.secretAccessKey,
      };
    }
    this.client = new SQSClient(config);
  }

  getClient() {
    return this.client;
  }

  async sendMessage(body: string, deduplicationId: string, groupId: string) {
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_CONFIG.queueUrl,
      MessageBody: body,
      MessageDeduplicationId: deduplicationId,
      MessageGroupId: groupId,
    });
    return this.client.send(command);
  }

  async sendMessageBatch(entries: Array<{ id: string; body: string; deduplicationId: string; groupId: string }>) {
    const command = new SendMessageBatchCommand({
      QueueUrl: QUEUE_CONFIG.queueUrl,
      Entries: entries.map(e => ({
        Id: e.id,
        MessageBody: e.body,
        MessageDeduplicationId: e.deduplicationId,
        MessageGroupId: e.groupId,
      })),
    });
    return this.client.send(command);
  }

  async receiveMessages(maxMessages = 10) {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_CONFIG.queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: QUEUE_CONFIG.waitTimeSeconds,
      VisibilityTimeout: QUEUE_CONFIG.visibilityTimeout,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
    });
    const res = await this.client.send(command);
    return res.Messages || [];
  }

  async deleteMessage(receiptHandle: string) {
    const command = new DeleteMessageCommand({
      QueueUrl: QUEUE_CONFIG.queueUrl,
      ReceiptHandle: receiptHandle,
      });
    return this.client.send(command);
  }

  async getQueueLength() {
    const command = new GetQueueAttributesCommand({
      QueueUrl: QUEUE_CONFIG.queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages'],
    });
    const res = await this.client.send(command);
    return parseInt(res.Attributes?.ApproximateNumberOfMessages || '0', 10);
  }

  async getQueueAttributes() {
    const command = new GetQueueAttributesCommand({
      QueueUrl: QUEUE_CONFIG.queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
    });
    const res = await this.client.send(command);
    return {
      queueLength: parseInt(res.Attributes?.ApproximateNumberOfMessages || '0', 10),
      inFlight: parseInt(res.Attributes?.ApproximateNumberOfMessagesNotVisible || '0', 10),
      dlqLength: 0,
    };
  }
}

export const sqsClientWrapper = new SqsClientWrapper();
