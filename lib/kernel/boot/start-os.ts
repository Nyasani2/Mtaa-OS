import { KernelBootSequence } from "./kernel-boot-sequence";

export async function startOS() {
  await KernelBootSequence.run();
  return { status: "started" };
}
