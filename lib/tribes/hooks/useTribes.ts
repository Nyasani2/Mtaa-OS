"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Tribe, TribePost, TribeMember } from "@/lib/tribes/types";

export function useTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTribes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: supaError } = await supabase.from("tribes").select("*").order("created_at", { ascending: false });
      if (supaError) throw supaError;
      setTribes(data || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to fetch tribes"); }
    finally { setLoading(false); }
  }, []);

  const fetchPosts = useCallback(async (tribeId: string) => {
    setLoading(true); setError(null);
    try {
      const { data, error: supaError } = await supabase.from("tribe_posts").select("*, profiles(full_name, avatar_url)").eq("tribe_id", tribeId).order("created_at", { ascending: false });
      if (supaError) throw supaError;
      setPosts(data || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to fetch posts"); }
    finally { setLoading(false); }
  }, []);

  const fetchMembers = useCallback(async (tribeId: string) => {
    setLoading(true); setError(null);
    try {
      const { data, error: supaError } = await supabase.from("tribe_members").select("*, profiles(full_name, avatar_url)").eq("tribe_id", tribeId);
      if (supaError) throw supaError;
      setMembers(data || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to fetch members"); }
    finally { setLoading(false); }
  }, []);

  const createTribe = useCallback(async (tribeData: Partial<Tribe>) => {
    setLoading(true); setError(null);
    try {
      const { data, error: supaError } = await supabase.from("tribes").insert(tribeData).select().maybeSingle();
      if (supaError) throw supaError;
      setTribes(prev => [data, ...prev]);
      return data;
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create tribe"); }
    finally { setLoading(false); }
  }, []);

  const joinTribe = useCallback(async (tribeId: string, userId: string) => {
    setLoading(true); setError(null);
    try {
      const { error: supaError } = await supabase.from("tribe_members").insert({ tribe_id: tribeId, user_id: userId, role: "member" });
      if (supaError) throw supaError;
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to join tribe"); }
    finally { setLoading(false); }
  }, []);

  return {
    tribes,
    posts,
    members,
    loading,
    error,
    fetchTribes,
    fetchPosts,
    fetchMembers,
    createTribe,
    joinTribe,
  };
}

export default useTribes;
