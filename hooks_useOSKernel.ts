import { useState, useEffect } from 'react';

export function useOSKernel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return {
    ready,
    version: '1.0.0',
    bootTime: Date.now(),
    kernel: {
      version: '1.0.0',
      status: 'running' as const,
      uptime: 0,
    },
  };
}

export default useOSKernel;
