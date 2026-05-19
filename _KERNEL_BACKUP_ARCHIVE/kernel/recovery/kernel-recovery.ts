class KernelRecovery {

  recover(app: string) {

    console.log(
      "[RECOVERY STARTED]",
      app
    );

    return {
      app,
      recovered: true,
      timestamp: Date.now()
    };
  }
}

export const kernelRecovery =
  new KernelRecovery();
