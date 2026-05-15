class KernelAIRouter {

  route(task: string) {

    if (task.includes("fraud")) {
      return "FRAUD_ENGINE";
    }

    if (task.includes("moderation")) {
      return "MODERATION_ENGINE";
    }

    return "GENERAL_AI";
  }
}

export const kernelAIRouter =
  new KernelAIRouter();
