// hooks/use-voting.ts
// MTAA Universal Voting Engine hook
// Imported by: lib/services/voting-service.ts (and others)

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface VotingSession {
  id: string;
  title: string;
  description?: string;
  type: 'election' | 'referendum' | 'poll' | 'survey';
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_by: string;
  options: VotingOption[];
  total_votes: number;
  created_at: string;
  updated_at?: string;
}

export interface VotingOption {
  id: string;
  session_id: string;
  label: string;
  description?: string;
  image_url?: string;
  vote_count: number;
  order_index: number;
}

export interface VoteRecord {
  id: string;
  session_id: string;
  user_id: string;
  option_id: string;
  encrypted_vote?: string;
  verified: boolean;
  created_at: string;
}

export interface VotingResult {
  optionId: string;
  label: string;
  votes: number;
  percentage: number;
}

export function useVoting() {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (filters?: { status?: string; type?: string }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('voting_sessions').select('*');
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.type) query = query.eq('type', filters.type);
      const { data, error: err } = await query.order('created_at', { ascending: false });
      if (err) throw err;
      setSessions((data || []) as VotingSession[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSession = useCallback(async (sessionId: string): Promise<VotingSession | null> => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select(`
          *,
          options:voting_options(*)
        `)
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data as VotingSession;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  const castVote = useCallback(async (sessionId: string, optionId: string): Promise<boolean> => {
    if (!user?.id) return false;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.rpc('mtaa_cast_vote', {
        p_session_id: sessionId,
        p_user_id: user.id,
        p_option_id: optionId,
      });
      if (error) throw error;
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getResults = useCallback(async (sessionId: string): Promise<VotingResult[]> => {
    try {
      const { data, error } = await supabase
        .from('voting_options')
        .select('*')
        .eq('session_id', sessionId)
        .order('vote_count', { ascending: false });
      if (error) throw error;
      const total = (data || []).reduce((sum: number, o: any) => sum + (o.vote_count || 0), 0);
      return (data || []).map((o: any) => ({
        optionId: o.id,
        label: o.label,
        votes: o.vote_count || 0,
        percentage: total > 0 ? ((o.vote_count || 0) / total) * 100 : 0,
      }));
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, []);

  const hasVoted = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data, error } = await supabase
        .from('voting_votes')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch (e) {
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    fetchSession,
    castVote,
    getResults,
    hasVoted,
  };
}

export default useVoting;
