import { BenchmarkResultDTO } from './benchmark.types.js';
import { BENCHMARK_ITERATIONS, WARMUP_ITERATIONS } from './benchmark.constants.js';

export async function runBenchmark(
  name: string,
  datasetSize: number,
  fn: () => Promise<void>
): Promise<BenchmarkResultDTO> {
  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    await fn();
  }

  const times: number[] = [];
  const startMemory = process.memoryUsage().heapUsed;

  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const endMemory = process.memoryUsage().heapUsed;
  const memoryUsageMb = (endMemory - startMemory) / 1024 / 1024;

  const executionTimeAvg = times.reduce((a, b) => a + b, 0) / times.length;
  const executionTimeMin = Math.min(...times);
  const executionTimeMax = Math.max(...times);

  return {
    name,
    datasetSize,
    executionTimeAvg,
    executionTimeMin,
    executionTimeMax,
    memoryUsageMb
  };
}

export function printBenchmarkResult(res: BenchmarkResultDTO) {
  console.log(`\nBenchmark: ${res.name} (Size: ${res.datasetSize})`);
  console.log(`Avg Time: ${res.executionTimeAvg.toFixed(2)} ms`);
  console.log(`Min Time: ${res.executionTimeMin.toFixed(2)} ms`);
  console.log(`Max Time: ${res.executionTimeMax.toFixed(2)} ms`);
  console.log(`Mem Usage: ${res.memoryUsageMb.toFixed(2)} MB\n`);
}
