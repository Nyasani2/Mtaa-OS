class KernelOrchestrator {
  boot() {
    return { state: 'BOOTED' };
  }

  tick(context?: any) {
    return {
      state: 'RUNNING',
      context,
      timestamp: Date.now(),
    };
  }
}

export const kernelOrchestrator = new KernelOrchestrator();
