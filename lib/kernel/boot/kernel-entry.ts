import { KernelRuntime } from "../runtime/kernel-runtime";

export function kernelEntry() {
  const runtime = new KernelRuntime();
  return runtime.boot();
}
