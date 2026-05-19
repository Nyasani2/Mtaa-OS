import {
  kernelAutonomy
} from "../autonomy/kernel-autonomy";

import {
  kernelAICore
} from "../ai-core/kernel-ai-core";

class KernelSystemBrain {

  think(input: any) {

    const ai =
      kernelAICore.analyze(input);

    const autonomy =
      kernelAutonomy.cycle();

    return {
      ai,
      autonomy,
      timestamp: Date.now()
    };
  }
}

export const kernelSystemBrain =
  new KernelSystemBrain();
