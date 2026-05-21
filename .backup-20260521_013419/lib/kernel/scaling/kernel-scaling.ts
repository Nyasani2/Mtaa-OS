class KernelScaling {

  evaluate(metrics: any) {

    if (
      metrics.cpu > 80
    ) {
      return "SCALE_UP";
    }

    return "STABLE";
  }
}

export const kernelScaling =
  new KernelScaling();
