import { connectMongoDB, disconnectMongoDB } from '../../src/db/connection.js';
import { runExplain, printExplainResult } from './explain-runner.js';
import mongoose from 'mongoose';

async function main() {
  await connectMongoDB();
  
  const result = await runExplain('cart_events', {
    productId: new mongoose.Types.ObjectId(),
    eventTimestamp: { $gte: new Date() }
  });
  
  printExplainResult(result);
  await disconnectMongoDB();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
