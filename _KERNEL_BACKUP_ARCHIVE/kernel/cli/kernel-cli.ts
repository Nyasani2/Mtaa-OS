import {
  kernelOrchestrator
} from "../orchestrator/kernel-orchestrator";

class KernelCLI {

  command(input: string) {

    if (input === "status") {

      return kernelOrchestrator.tick({
        cli: true
      });
    }

    if (input === "shutdown") {

      return {
        state: "SHUTTING_DOWN"
      };
    }

    return {
      error: "UNKNOWN_COMMAND"
    };
  }
}

export const kernelCLI =
  new KernelCLI();
