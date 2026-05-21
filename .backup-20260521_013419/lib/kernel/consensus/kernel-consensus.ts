class KernelConsensus {

  approve(
    proposal: string,
    votes: number,
    threshold: number
  ) {

    return votes >= threshold;
  }
}

export const kernelConsensus =
  new KernelConsensus();
