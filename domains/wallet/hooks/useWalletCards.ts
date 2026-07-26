import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWalletCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCards = useCallback(async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from('wallet_cards').select('*').eq('user_id', userId);
    setCards(data || []);
    setLoading(false);
  }, []);

  return { cards, loading, fetchCards };
}
