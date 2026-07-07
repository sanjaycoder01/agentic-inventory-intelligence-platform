import { connectMongoDB, disconnectMongoDB } from '../../src/db/connection.js';
import { runBenchmark, printBenchmarkResult } from './benchmark-runner.js';
import mongoose from 'mongoose';
import { PERFORMANCE_CONSTANTS } from '../../src/modules/performance/performance.constants.js';

async function main() {
  await connectMongoDB();
  console.log("Starting benchmarks...");

  for (const size of PERFORMANCE_CONSTANTS.BENCHMARK_SIZES) {
    if (size > 100000) continue; // Keep it fast for demo purposes
    
    const res = await runBenchmark('Simple Orders Query', size, async () => {
      await mongoose.connection.collection('orders').find({ orderStatus: 'PLACED' }).limit(10).toArray();
    });
    
    printBenchmarkResult(res);
  }

  await disconnectMongoDB();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
