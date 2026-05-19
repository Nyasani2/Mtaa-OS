class KernelResourceControl {

  allocate(
    app: string,
    cpu: number,
    memory: number
  ) {

    return {
      app,
      cpu,
      memory,
      allocated: true
    };
  }
}

export const kernelResourceControl =
  new KernelResourceControl();
