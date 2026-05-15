class KernelAnomalyEngine {

  detect(metrics: any) {

    const suspicious =
      metrics.cpu > 95;

    return {
      suspicious,
      metrics
    };
  }
}

export const kernelAnomalyEngine =
  new KernelAnomalyEngine();
