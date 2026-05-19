class KernelMetrics {

  private metrics: Record<string, number> = {};

  record(key: string, value: number) {
    this.metrics[key] = value;
  }

  getAll() {
    return this.metrics;
  }
}

export const kernelMetrics = new KernelMetrics();
