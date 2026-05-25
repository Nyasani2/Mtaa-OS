// lib/kernel/use-kernel-boot.ts
import { useEffect, useState } from 'react';
import { useIdentity } from '@/lib/auth/identity';
import { useOSShell } from '@/lib/shell/use-os-shell';

export function useKernelBoot() {
  const identity = useIdentity();
  const shell = useOSShell();
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await shell.boot();
        setBooted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Boot failed');
      }
    };
    init();
  }, [shell]);

  return {
    booted,
    error,
    isLoading: identity.isLoading || shell.isBooting,
    isReady: booted && !identity.isLoading && !shell.isLocked,
    user: identity.user,
    session: identity.session,
  };
}
