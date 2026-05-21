class KernelAICore {

  analyze(input: any) {

    return {
      decision: "ALLOW",
      confidence: 0.94,
      input
    };
  }
}

export const kernelAICore =
  new KernelAICore();
