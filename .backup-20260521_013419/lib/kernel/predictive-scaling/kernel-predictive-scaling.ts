class KernelPredictiveScaling {

  forecast(load: number) {

    if (load > 75) {
      return "PRE_SCALE";
    }

    return "STABLE";
  }
}

export const kernelPredictiveScaling =
  new KernelPredictiveScaling();
