class KernelNetwork {

  status() {

    return {
      online: true,
      latency: 24,
      region: "AFRICA"
    };
  }
}

export const kernelNetwork =
  new KernelNetwork();
