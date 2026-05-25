import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { kernelEventBus } from './kernel-event-bus';

interface KernelContextValue { isInitialized: boolean; version: string; health: 'healthy' | 'degraded' | 'down'; }
const KernelContext = createContext<KernelContextValue>({ isInitialized: false, version: '1.0.0', health: 'down' });

export function KernelProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'down'>('down');

  useEffect(() => {
    async function init() {
      try {
        const { error } = await supabase.from('kernel_events').select('id').limit(1);
        if (error && error.code !== 'PGRST116') { setHealth('degraded'); }
        else { setHealth('healthy'); }
        setIsInitialized(true);
        kernelEventBus.emit('kernel:init', { health: error ? 'degraded' : 'healthy' });
      } catch (err) {
        setHealth('down');
        setIsInitialized(true);
        kernelEventBus.emit('kernel:init', { health: 'down', error: err });
      }
    }
    init();
  }, []);

  return (
    <KernelContext.Provider value={{ isInitialized, version: '1.0.0', health }}>
      {children}
    </KernelContext.Provider>
  );
}

export function useKernel() { return useContext(KernelContext); }
