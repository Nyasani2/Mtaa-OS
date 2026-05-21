class KernelLoadBalancer {

  distribute(
    workers: string[],
    request: any
  ) {

    const selected =
      workers[
        Math.floor(
          Math.random() * workers.length
        )
      ];

    return {
      worker: selected,
      request
    };
  }
}

export const kernelLoadBalancer =
  new KernelLoadBalancer();
