class KernelState {

  private state: Record<string, any> = {};

  set(key: string, value: any) {
    this.state[key] = value;
  }

  get(key: string) {
    return this.state[key];
  }
}

export const kernelState =
  new KernelState();
