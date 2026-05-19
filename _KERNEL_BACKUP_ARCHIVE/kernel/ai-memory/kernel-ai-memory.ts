class KernelAIMemory {

  private memory: Record<string, any> = {};

  remember(key: string, value: any) {

    this.memory[key] = value;
  }

  recall(key: string) {

    return this.memory[key];
  }
}

export const kernelAIMemory =
  new KernelAIMemory();
