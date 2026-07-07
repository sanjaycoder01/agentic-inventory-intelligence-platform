import { connectMongoDB, disconnectMongoDB } from '../../src/db/connection.js';
import { runExplain, printExplainResult } from './explain-runner.js';

async function main() {
  await connectMongoDB();
  
  const result = await runExplain('notifications', {
    status: "PENDING"
  }, { createdAt: 1 });
  
  printExplainResult(result);
  await disconnectMongoDB();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
