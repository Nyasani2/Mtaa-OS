class KernelWatchdog {

  monitor(app: string) {

    console.log(
      "[WATCHDOG ACTIVE]",
      app
    );

    return {
      app,
      healthy: true
    };
  }
}

export const kernelWatchdog =
  new KernelWatchdog();
