class KernelReputation {

  score(user: string) {

    return {
      user,
      reputation: 87
    };
  }
}

export const kernelReputation =
  new KernelReputation();
