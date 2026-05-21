class KernelMonitor {
  health() {
    return {
      score: 100,
      status: 'OK',
      timestamp: Date.now(),
    };
  }

  track(event?: any) {
    return {
      recorded: true,
      event,
    };
  }
}

export const kernelMonitor = new KernelMonitor();
