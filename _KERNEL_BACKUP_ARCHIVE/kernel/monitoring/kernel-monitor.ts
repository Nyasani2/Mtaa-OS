class KernelMonitor {

  health() {

    return {
      cpu: "NORMAL",
      memory: "NORMAL",
      network: "NORMAL",
      realtime: "CONNECTED",
      timestamp: Date.now()
    };
  }
}

export const kernelMonitor =
  new KernelMonitor();
