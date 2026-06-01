// lib/mtruck/services/messageService.ts
// Domain-specific messaging (replaces generic messages table)

import { supabase } from "@/lib/supabase";

export async function sendMessage(payload: {
  sender_id: string;
  receiver_id: string;
  load_id?: string;
  content: string;
  type?: "text" | "quote" | "image" | "location" | "system";
}) {
  const { data, error } = await supabase.from("mtruck_messages").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function getMessagesForLoad(loadId: string, userId: string) {
  const { data, error } = await supabase
    .from("mtruck_messages")
    .select("*, sender:profiles(id, full_name, avatar_url)")
    .eq("load_id", loadId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function markMessagesRead(loadId: string, readerId: string) {
  const { error } = await supabase
    .from("mtruck_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("load_id", loadId)
    .eq("receiver_id", readerId)
    .is("read_at", null);
  if (error) throw error;
}
