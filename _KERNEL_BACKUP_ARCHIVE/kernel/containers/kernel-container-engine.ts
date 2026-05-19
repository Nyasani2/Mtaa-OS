class KernelContainerEngine {

  start(container: string) {

    console.log(
      "[CONTAINER STARTED]",
      container
    );

    return true;
  }

  stop(container: string) {

    console.log(
      "[CONTAINER STOPPED]",
      container
    );

    return true;
  }
}

export const kernelContainerEngine =
  new KernelContainerEngine();
