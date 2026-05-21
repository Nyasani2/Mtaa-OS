/**
 * MTAA OS — useCivicAlerts Hook (stub)
 */

import { useEffect, useState } from 'react';

export interface CivicAlert {
  id: string;
  message: string;
  source: string;
  severity: 'info' | 'warning' | 'critical';
}

export function useCivicAlerts() {
  const [alerts, setAlerts] = useState<CivicAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAlerts([
      { id: '1', message: 'Road maintenance scheduled on Mombasa Rd', source: 'Streets', severity: 'info' },
      { id: '2', message: 'Tax filing deadline approaching', source: 'Revenue', severity: 'warning' },
    ]);
    setIsLoading(false);
  }, []);

  return { alerts, isLoading };
}
