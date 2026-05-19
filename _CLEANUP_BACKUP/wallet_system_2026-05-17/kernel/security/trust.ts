class KernelTrust {

  evaluate(entity: string) {

    return {
      entity,
      trust_score: 91
    };
  }
}

export const kernelTrust =
  new KernelTrust();
