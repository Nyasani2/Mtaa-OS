class KernelSimulation {

  run(name: string) {

    return {
      simulation: name,
      result: "SUCCESS"
    };
  }
}

export const kernelSimulation =
  new KernelSimulation();
