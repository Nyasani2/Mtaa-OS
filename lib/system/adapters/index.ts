// lib/system/adapters/index.ts — System adapter coordinator
import { kernelAdapter } from './kernel-adapter';
import { walletAdapter } from './wallet-adapter';
import { asisAdapter } from './asis-adapter';

export function activateAllAdapters() {
  kernelAdapter.activate();
  walletAdapter.activate();
  asisAdapter.activate();
}

export function deactivateAllAdapters() {
  kernelAdapter.deactivate();
  walletAdapter.deactivate();
  asisAdapter.deactivate();
}

export function areAllAdaptersActive() {
  return kernelAdapter.isActive && walletAdapter.isActive && asisAdapter.isActive;
}

export { kernelAdapter, walletAdapter, asisAdapter };
