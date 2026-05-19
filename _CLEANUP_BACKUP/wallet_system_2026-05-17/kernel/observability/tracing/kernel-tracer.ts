class KernelTracer {

  traces: any[] = [];

  span(name: string, data?: any) {
    this.traces.push({
      span: name,
      data,
      ts: Date.now()
    });
  }

  getTraces() {
    return this.traces;
  }
}

export const kernelTracer = new KernelTracer();
