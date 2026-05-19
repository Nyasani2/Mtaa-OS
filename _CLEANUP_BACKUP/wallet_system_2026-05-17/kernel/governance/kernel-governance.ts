class KernelGovernance {

  issue(
    category: string,
    severity: number
  ) {

    return {
      category,
      severity,
      escalation:
        severity > 7
          ? "HIGH"
          : "NORMAL"
    };
  }
}

export const kernelGovernance =
  new KernelGovernance();
