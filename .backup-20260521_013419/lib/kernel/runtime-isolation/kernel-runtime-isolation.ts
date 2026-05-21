class KernelRuntimeIsolation {

  isolate(app: string) {

    console.log(
      "[APP ISOLATED]",
      app
    );

    return {
      app,
      isolated: true
    };
  }
}

export const kernelRuntimeIsolation =
  new KernelRuntimeIsolation();
