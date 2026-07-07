import mongoose from 'mongoose';
import { ExplainResultDTO } from '../../src/modules/performance/performance.types.js';

export async function runExplain(
  collectionName: string,
  query: any,
  sort: any = {}
): Promise<ExplainResultDTO> {
  const collection = mongoose.connection.collection(collectionName);
  let cursor = collection.find(query);
  if (Object.keys(sort).length > 0) {
    cursor = cursor.sort(sort);
  }
  
  const explainOutput: any = await cursor.explain('executionStats');
  const executionStats = explainOutput.executionStats || { executionTimeMillis: 0, totalDocsExamined: 0, totalKeysExamined: 0 };
  const winningPlan = explainOutput.queryPlanner?.winningPlan || { stage: 'UNKNOWN' };
  
  const extractStages = (plan: any): string[] => {
    let stages: string[] = [];
    if (!plan) return stages;
    if (plan.stage) stages.push(plan.stage);
    if (plan.inputStage) stages = stages.concat(extractStages(plan.inputStage));
    if (plan.inputStages) {
      for (const st of plan.inputStages) {
        stages = stages.concat(extractStages(st));
      }
    }
    return stages;
  };
  const stages = extractStages(winningPlan);
  const isCollectionScan = stages.includes('COLLSCAN');

  return {
    collection: collectionName,
    winningPlan: winningPlan.stage,
    executionTimeMillis: executionStats.executionTimeMillis,
    totalDocsExamined: executionStats.totalDocsExamined,
    totalKeysExamined: executionStats.totalKeysExamined,
    isCollectionScan,
    stages
  };
}

export function printExplainResult(result: ExplainResultDTO) {
  console.log(`\nCollection: ${result.collection}`);
  console.log(`Winning Plan:\n${result.winningPlan}`);
  console.log(`Execution Time:\n${result.executionTimeMillis} ms`);
  console.log(`Documents Examined:\n${result.totalDocsExamined}`);
  console.log(`Keys Examined:\n${result.totalKeysExamined}`);
  console.log(`Collection Scan:\n${result.isCollectionScan ? 'YES' : 'NO'}\n`);
}
