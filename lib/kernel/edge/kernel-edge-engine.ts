class KernelEdgeEngine {

  evaluate(region: string) {

    return {
      edge_region: region,
      latency_optimized: true
    };
  }
}

export const kernelEdgeEngine =
  new KernelEdgeEngine();
