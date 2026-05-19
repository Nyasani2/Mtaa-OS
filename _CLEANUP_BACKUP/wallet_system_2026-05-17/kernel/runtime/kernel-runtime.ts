export class KernelRuntime {
  boot() {
    console.log("KernelRuntime booted");
  }

  getState() {
    return {
      status: "healthy",
      uptime: Date.now(),
    };
  }
}

export const kernelRuntime = new KernelRuntime();
