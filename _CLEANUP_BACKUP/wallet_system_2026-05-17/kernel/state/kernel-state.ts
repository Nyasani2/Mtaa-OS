export type KernelPhase =
  | 'BOOTING'
  | 'READY'
  | 'DEGRADED'
  | 'RECOVERING'
  | 'PANIC'
  | 'OFFLINE';

class KernelStateAuthority {
  private phase: KernelPhase = 'BOOTING';

  private healthScore = 100;

  getState() {
    return {
      phase: this.phase,
      healthScore: this.healthScore,
    };
  }

  setPhase(phase: KernelPhase) {
    this.phase = phase;

    console.log('[KERNEL PHASE]', phase);
  }

  setHealth(score: number) {
    this.healthScore = Math.max(
      0,
      Math.min(100, score)
    );

    if (score < 40) {
      this.phase = 'DEGRADED';
    }

    if (score < 20) {
      this.phase = 'PANIC';
    }
  }
}

export const kernelState =
  new KernelStateAuthority();
