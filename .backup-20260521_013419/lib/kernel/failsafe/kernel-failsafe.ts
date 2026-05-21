class KernelFailsafe {

  trigger(reason: string) {

    console.log(
      "[FAILSAFE ACTIVATED]",
      reason
    );

    return {
      state: "SAFE_MODE",
      reason,
      timestamp: Date.now()
    };
  }
}

export const kernelFailsafe =
  new KernelFailsafe();
