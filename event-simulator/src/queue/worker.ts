import 'dotenv/config';
import { SqsConsumer } from './sqs.consumer.js';
import { EventDispatcher } from '../dispatch/event.dispatcher.js';
import { BackendClient } from '../services/backend.client.js';
import { QUEUE_CONFIG } from './queue.config.js';
import { getQueueHealth } from './queue.health.js';

const backendClient = new BackendClient();
const dispatcher = new EventDispatcher(backendClient);
const consumer = new SqsConsumer(dispatcher);

let running = true;
let shuttingDown = false;

async function main() {
  console.log(`SQS Consumer Worker started. Long polling with waitTimeSeconds=${QUEUE_CONFIG.waitTimeSeconds} and maxBatchSize=${QUEUE_CONFIG.maxBatchSize}...`);
  while (running) {
    try {
      const processed = await consumer.pollAndProcess();
      if (processed === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err: any) {
      console.error('Worker loop error:', err.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  if (!shuttingDown) {
    console.log('Worker shut down gracefully.');
    return;
  }

  const health = await getQueueHealth(true);
  console.log(JSON.stringify({ action: 'WorkerShutdown', health }));
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Stopping worker...');
  shuttingDown = true;
  running = false;
});
process.on('SIGINT', () => {
  console.log('SIGINT received. Stopping worker...');
  shuttingDown = true;
  running = false;
});

main().catch(console.error);
