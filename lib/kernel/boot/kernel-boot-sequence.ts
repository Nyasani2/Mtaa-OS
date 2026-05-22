import { KernelRegistry } from "../registry/kernel-registry";

export class KernelBootSequence {
  static async run() {
    const registry = KernelRegistry.getInstance();
    await registry.initialize();
    return { status: "booted" };
  }
}
