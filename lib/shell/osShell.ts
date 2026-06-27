// lib/shell/osShell.ts
import { useOSShell } from './use-os-shell';

export function useOSStatus() {
  const shell = useOSShell();

  return {
    isBooting: shell.isBooting,
    isAuthenticated: shell.isAuthenticated,
    isPinSet: shell.isPinSet,
    isLocked: shell.isLocked,
    isUnlocked: shell.isUnlocked,
    bootError: shell.bootError,
  };
}

export function useOSActions() {
  const shell = useOSShell();

  return {
    unlock: shell.unlock,
    lock: shell.lock,
    refreshPinState: shell.refreshPinState,
  };
}
