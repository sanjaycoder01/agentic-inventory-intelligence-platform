export interface QueueMetricsSnapshot {
  published: number;
  received: number;
  processed: number;
  failed: number;
  deleted: number;
  retryCount: number;
  dlqCount: number;
}

class QueueMetricsService {
  private metrics: QueueMetricsSnapshot = {
    published: 0,
    received: 0,
    processed: 0,
    failed: 0,
    deleted: 0,
    retryCount: 0,
    dlqCount: 0,
  };

  recordPublished(count = 1) {
    this.metrics.published += count;
  }

  recordReceived(count = 1) {
    this.metrics.received += count;
  }

  recordProcessed(count = 1) {
    this.metrics.processed += count;
  }

  recordFailed(count = 1) {
    this.metrics.failed += count;
  }

  recordDeleted(count = 1) {
    this.metrics.deleted += count;
  }

  recordRetry(count = 1) {
    this.metrics.retryCount += count;
  }

  recordDlq(count = 1) {
    this.metrics.dlqCount += count;
  }

  getSnapshot(): QueueMetricsSnapshot {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      published: 0,
      received: 0,
      processed: 0,
      failed: 0,
      deleted: 0,
      retryCount: 0,
      dlqCount: 0,
    };
  }
}

export const queueMetricsService = new QueueMetricsService();
