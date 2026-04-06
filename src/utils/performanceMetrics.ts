// src/utils/performanceMetrics.ts
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  location?: string;
  cacheStatus?: 'hit' | 'miss' | 'partial';
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export class PerformanceTracker {
  private metrics: PerformanceMetrics;
  private steps: ProcessingStep[] = [];

  constructor() {
    this.metrics = {
      startTime: performance.now(),
      processingSteps: []
    };
  }

  startStep(name: string): void {
    // Complete previous step if not already completed
    if (this.steps.length > 0) {
      const lastStep = this.steps[this.steps.length - 1];
      if (!lastStep.endTime) {
        lastStep.endTime = performance.now();
        lastStep.duration = lastStep.endTime - lastStep.startTime;
      }
    }

    this.steps.push({
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0
    });
  }

  endStep(name?: string): void {
    let step: ProcessingStep | undefined;
    
    if (name) {
      step = this.steps.find(s => s.name === name && !s.endTime);
    } else {
      // Find the last uncompleted step
      step = this.steps.reverse().find(s => !s.endTime);
      // Reverse back to original order
      this.steps.reverse();
    }

    if (step) {
      step.endTime = performance.now();
      step.duration = step.endTime - step.startTime;
    }
  }

  complete(options?: {
    location?: string;
    cacheStatus?: 'hit' | 'miss' | 'partial';
  }): PerformanceMetrics {
    this.metrics.endTime = performance.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    
    if (options) {
      if (options.location) {
        this.metrics.location = options.location;
      }
      if (options.cacheStatus) {
        this.metrics.cacheStatus = options.cacheStatus;
      }
    }
    
    // Complete any remaining steps
    this.steps.forEach(step => {
      if (!step.endTime) {
        step.endTime = performance.now();
        step.duration = step.endTime - step.startTime;
      }
    });
    
    this.metrics.processingSteps = [...this.steps];
    return this.metrics;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      startTime: performance.now(),
      processingSteps: []
    };
    this.steps = [];
  }
}

// Utility function to measure function execution
export async function measureAsync<T>(
  fn: () => Promise<T>,
  _stepName: string = 'async-operation'
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  } catch (error) {
    const end = performance.now();
    throw { error, duration: end - start };
  }
}

// Utility function to measure synchronous function execution
export function measure<T>(
  fn: () => T,
  _stepName: string = 'sync-operation'
): { result: T; duration: number } {
  const start = performance.now();
  try {
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  } catch (error) {
    const end = performance.now();
    throw { error, duration: end - start };
  }
}