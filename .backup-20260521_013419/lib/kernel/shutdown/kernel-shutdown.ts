class KernelShutdown {

  stop() {

    console.log(
      "[SYSTEM SHUTDOWN INITIATED]"
    );

    return {
      state: "OFFLINE"
    };
  }
}

export const kernelShutdown =
  new KernelShutdown();
