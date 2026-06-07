// lib/kernel/use-kernel-boot.ts — Kernel boot sequence
import { useCallback, useEffect, useState } from 'react';
import { useOSShell } from '@/lib/shell/use-os-shell';

export function useKernelBoot() {
  const { isAuthenticated, isUnlocked } = useOSShell();
  const [isReady, setIsReady] = useState(false);

  const boot = useCallback(async () => {
    // Kernel boot: wait for auth + pin unlock
    if (isAuthenticated && isUnlocked) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [isAuthenticated, isUnlocked]);

  useEffect(() => {
    boot();
  }, [boot]);

  return { isReady, boot };
}
