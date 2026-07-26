import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useVoting() {
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const castVote = useCallback(async (pollId: string, optionId: string, userId: string) => {
    const { data, error } = await supabase
      .from('votes')
      .insert({ poll_id: pollId, option_id: optionId, user_id: userId })
      .select()
      .single();
    if (error) return { error: error.message };
    return { data };
  }, []);

  const fetchVotes = useCallback(async (pollId: string) => {
    setLoading(true);
    const { data } = await supabase.from('votes').select('*').eq('poll_id', pollId);
    setVotes(data || []);
    setLoading(false);
  }, []);

  return { votes, loading, castVote, fetchVotes };
}
