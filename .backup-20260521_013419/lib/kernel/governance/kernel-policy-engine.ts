class KernelPolicyEngine {

  enforce(
    policy: string,
    payload: any
  ) {

    return {
      policy,
      allowed: true,
      payload
    };
  }
}

export const kernelPolicyEngine =
  new KernelPolicyEngine();
