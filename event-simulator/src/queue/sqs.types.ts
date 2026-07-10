export interface SQSMessageEnvelope<T> {
  messageId: string;
  receiptHandle: string;
  body: T;
  attributes?: Record<string, string>;
}
