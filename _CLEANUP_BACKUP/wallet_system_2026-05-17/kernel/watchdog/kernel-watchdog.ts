class KernelWatchdog {

  private interval?: NodeJS.Timeout;

  start() {}

  stop() {}

  monitor() {
    return {
      status: 'OK',
    };
  }
}

export const kernelWatchdog =
  new KernelWatchdog();
