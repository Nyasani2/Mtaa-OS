/**
 * MTAA System Bus — Adapter Exports
 * Import all adapters from here to activate the bridge layer
 */

export { kernelAdapter } from './kernel-adapter'
export { walletAdapter } from './wallet-adapter'
export { asisAdapter } from './asis-adapter'

/**
 * Activate ALL adapters at once
 * Call this during kernel boot to connect all subsystems
 */
export function activateAllAdapters(): void {
  kernelAdapter.activate()
  walletAdapter.activate()
  asisAdapter.activate()
  console.log('[Adapter Layer] All adapters activated')
}

/**
 * Deactivate ALL adapters
 */
export function deactivateAllAdapters(): void {
  kernelAdapter.deactivate()
  walletAdapter.deactivate()
  asisAdapter.deactivate()
  console.log('[Adapter Layer] All adapters deactivated')
}

/**
 * Check if all adapters are active
 */
export function areAllAdaptersActive(): boolean {
  return kernelAdapter.isActive && walletAdapter.isActive && asisAdapter.isActive
}
