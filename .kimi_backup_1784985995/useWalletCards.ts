/**
 * MTAA OS V10 — useWalletCards Hook
 * Card management: add, remove, set default
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchWalletCards, addWalletCard } from '@/lib/services/wallet-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useWalletCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWalletCards(userId);
      setCards(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addCard = useCallback(async (payload: any) => {
    if (!userId) throw new Error('Not authenticated');
    const item = await addWalletCard(userId, payload);
    setCards((prev) => [item, ...prev]);
    return item;
  }, [userId]);

  const removeCard = useCallback(async (cardId: string) => {
    const { supabase } = await import('@/lib/supabase/client');
    const { error } = await supabase.from('wallet_cards').delete().eq('id', cardId);
    if (error) throw error;
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const setDefault = useCallback(async (cardId: string) => {
    const { supabase } = await import('@/lib/supabase/client');
    // Unset all defaults
    await supabase.from('wallet_cards').update({ is_default: false }).eq('user_id', userId);
    // Set new default
    const { data, error } = await supabase
      .from('wallet_cards')
      .update({ is_default: true })
      .eq('id', cardId)
      .select()
      .single();
    if (error) throw error;
    setCards((prev) => prev.map((c) => (c.id === cardId ? data : { ...c, is_default: false })));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { cards, isLoading, error, refresh: load, addCard, removeCard, setDefault };
}
