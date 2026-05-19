class KernelAutonomyGate {

  allow(action: string, riskScore: number) {

    if (riskScore > 0.8) {
      return {
        allowed: false,
        reason: "HIGH_RISK_BLOCKED"
      };
    }

    return {
      allowed: true
    };
  }
}

export const kernelAutonomyGate = new KernelAutonomyGate();
