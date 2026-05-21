// MTAA SINGLE KERNEL ENTRY POINT
// This defines the ONLY allowed runtime kernel bootstrap

import { KernelRuntime } from '../lib/kernel/runtime/kernel-runtime';

export function bootKernel() {
  console.log('[KERNEL BOOT] Initializing single runtime kernel...');

  const kernel = new KernelRuntime({
    mode: 'production',
    strictMode: true,
    singleSourceOfTruth: true
  });

  kernel.start();
  return kernel;
}
