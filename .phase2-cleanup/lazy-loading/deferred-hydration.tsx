// lib/mtaa/lazy-loading/deferred-hydration.tsx
import React, { useEffect, useState, ReactNode } from 'react';

export function DeferredHydration({ children, delayMs = 100, priority = 'idle' }: { children: ReactNode; delayMs?: number; priority?: 'immediate'|'idle'|'background' }) {
  const [shouldRender, setShouldRender] = useState(priority === 'immediate');
  useEffect(() => {
    if (priority === 'immediate') return;
    if (priority === 'idle' && 'requestIdleCallback' in globalThis) {
      const id = requestIdleCallback(() => setShouldRender(true), { timeout: delayMs });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setShouldRender(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, priority]);
  if (!shouldRender) return null;
  return <>{children}</>;
}
