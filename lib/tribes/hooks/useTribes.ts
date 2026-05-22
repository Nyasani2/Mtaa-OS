"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
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

  const createPost = useCallback(async (tribeId: string, content: string, mediaUrl?: string) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const { data, error: supaError } = await supabase.from("tribe_posts").insert({
        tribe_id: tribeId, user_id: userId, content, media_url: mediaUrl || null,
        likes_count: 0, comments_count: 0,
      }).select().single();
      if (supaError) throw supaError;
      setPosts((prev) => [data, ...prev]); return data;
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create post"); throw err; }
    finally { setLoading(false); }
  }, []);

  const joinTribe = useCallback(async (tribeId: string) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const { error: supaError } = await supabase.from("tribe_members").insert({ tribe_id: tribeId, user_id: userId, role: "member" });
      if (supaError) throw supaError;
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to join tribe"); throw err; }
    finally { setLoading(false); }
  }, []);

  const leaveTribe = useCallback(async (tribeId: string) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const { error: supaError } = await supabase.from("tribe_members").delete().eq("tribe_id", tribeId).eq("user_id", userId);
      if (supaError) throw supaError;
      setTribes((prev) => prev.filter((t) => t.id !== tribeId));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to leave tribe"); throw err; }
    finally { setLoading(false); }
  }, []);

  return { tribes, posts, members, loading, error, fetchTribes, fetchPosts, createPost, joinTribe, leaveTribe };
}

export function useTribePosts(tribeId: string) {
  const { posts, loading, error, fetchPosts } = useTribes();
  return { posts, loading, error, refresh: () => fetchPosts(tribeId) };
}

export function useTribeChat(tribeId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const sendMessage = useCallback(async (content: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), content, sender: "me", created_at: new Date().toISOString() }]);
  }, []);
  return { messages, loading, sendMessage };
}
