class KernelStorage {

  private storage: Record<string, any> = {};

  write(key: string, value: any) {

    this.storage[key] = value;
  }

  read(key: string) {

    return this.storage[key];
  }

  delete(key: string) {

    delete this.storage[key];
  }
}

export const kernelStorage =
  new KernelStorage();
