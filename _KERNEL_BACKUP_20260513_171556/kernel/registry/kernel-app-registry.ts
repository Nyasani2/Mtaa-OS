class KernelRegistry {

  private apps: any[] = [];

  register(app: any) {

    this.apps.push(app);

    console.log(
      "[APP REGISTERED]",
      app.name
    );
  }

  list() {
    return this.apps;
  }
}

export const kernelRegistry =
  new KernelRegistry();
