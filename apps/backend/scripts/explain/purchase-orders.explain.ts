import { connectMongoDB, disconnectMongoDB } from '../../src/db/connection.js';
import { runExplain, printExplainResult } from './explain-runner.js';
import mongoose from 'mongoose';

async function main() {
  await connectMongoDB();
  
  const result = await runExplain('purchase_orders', {
    warehouseId: new mongoose.Types.ObjectId(),
    status: "DRAFT"
  });
  
  printExplainResult(result);
  await disconnectMongoDB();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
