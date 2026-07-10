import 'dotenv/config';

export const QUEUE_CONFIG = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  queueUrl: process.env.SQS_QUEUE_URL,
  dlqUrl: process.env.SQS_DLQ_URL,
  maxBatchSize: parseInt(process.env.SQS_MAX_BATCH_SIZE || '10', 10),
  waitTimeSeconds: parseInt(process.env.SQS_WAIT_TIME_SECONDS || '20', 10),
  visibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT || '30', 10),
  provider: process.env.QUEUE_PROVIDER || 'MEMORY',
};
