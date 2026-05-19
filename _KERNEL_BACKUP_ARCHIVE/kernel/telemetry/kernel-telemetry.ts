class KernelTelemetry {

  track(event: string, data?: any) {

    console.log(
      "[TELEMETRY]",
      event,
      data ?? {}
    );
  }
}

export const kernelTelemetry =
  new KernelTelemetry();
