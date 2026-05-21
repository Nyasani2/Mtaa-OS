/**
 * MTAA OS — useRecentActivity Hook (stub)
 */

import { useEffect, useState } from 'react';

export interface Activity {
  id: string;
  title: string;
  time: string;
  icon: string;
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActivities([
      { id: '1', title: 'Wallet top-up completed', time: '2 min ago', icon: '◉' },
      { id: '2', title: 'Civic project bid submitted', time: '15 min ago', icon: '🏗' },
      { id: '3', title: 'MTAXI ride completed', time: '1 hr ago', icon: '🚕' },
    ]);
    setIsLoading(false);
  }, []);

  return { activities, isLoading };
}
