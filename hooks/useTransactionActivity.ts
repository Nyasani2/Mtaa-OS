/**
 * MTAA OS — useTransactionActivity Hook (stub)
 */

import { useEffect, useState } from 'react';

export interface Transaction {
  id: string;
  type: 'in' | 'out';
  amount: string;
  description: string;
  time: string;
}

export function useTransactionActivity() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTransactions([
      { id: '1', type: 'in', amount: 'KES 5,000', description: 'Wallet top-up', time: '2 min ago' },
      { id: '2', type: 'out', amount: 'KES 1,200', description: 'MTAXI ride', time: '1 hr ago' },
      { id: '3', type: 'out', amount: 'KES 850', description: 'Marketplace purchase', time: '3 hrs ago' },
    ]);
    setIsLoading(false);
  }, []);

  return { transactions, isLoading };
}
