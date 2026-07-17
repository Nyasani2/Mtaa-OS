/**
 * MTAA System Adapters — Barrel Export
 * 
 * FIXED 2026-07-16: Removed activateAllAdapters() which triggered broken imports.
 * Each adapter now activates independently via its own activate() method.
 */

export { asisAdapter } from './asis-adapter'
export { healthAdapter } from './health-adapter'
export { identityAdapter } from './identity-adapter'
export { kernelAdapter } from './kernel-adapter'
export { messengerAdapter } from './messenger-adapter'
export { notificationAdapter } from './notification-adapter'
export { osShellAdapter } from './os-shell-adapter'
export { walletAdapter } from './wallet-adapter'

// REMOVED: activateAllAdapters() — it triggered broken imports in asis-adapter
// Each adapter should be activated by the kernel boot sequence individually
// export function activateAllAdapters(): void { ... }
