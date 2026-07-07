export interface ExplainResultDTO {
  collection: string;
  winningPlan: string;
  executionTimeMillis: number;
  totalDocsExamined: number;
  totalKeysExamined: number;
  isCollectionScan: boolean;
  stages: string[];
}

export interface BenchmarkResultDTO {
  name: string;
  datasetSize: number;
  executionTimeAvg: number;
  executionTimeMin: number;
  executionTimeMax: number;
  memoryUsageMb: number;
}

export interface PerformanceReportDTO {
  explains: ExplainResultDTO[];
  benchmarks: BenchmarkResultDTO[];
  timestamp: string;
}
