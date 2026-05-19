class KernelServiceDiscovery {

  private services: string[] = [];

  register(service: string) {

    this.services.push(service);

    console.log(
      "[SERVICE REGISTERED]",
      service
    );
  }

  discover() {
    return this.services;
  }
}

export const kernelServiceDiscovery =
  new KernelServiceDiscovery();
