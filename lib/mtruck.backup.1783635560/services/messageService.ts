import { supabase } from "@/lib/supabase";
import type { MtruckMessage } from "@/lib/mtruck/types";

const TABLE_MESSAGES = 'mtruck_messages';

export async function sendMessage(payload: {
  sender_id: string;
  receiver_id: string;
  job_id?: string;
  shipment_id?: string;
  content: string;
  message_type?: MtruckMessage['message_type'];
  attachments?: string[];
}): Promise<MtruckMessage> {
  const { data, error } = await supabase
    .from(TABLE_MESSAGES)
    .insert({
      ...payload,
      message_type: payload.message_type ?? 'text',
      attachments: payload.attachments ?? []
    })
    .select()
    .single();
  if (error) throw new Error(`Send message failed: ${error.message}`);
  return data;
}

export async function getMessagesForJob(loadId: string, userId: string): Promise<MtruckMessage[]> {
  const { data, error } = await supabase
    .from(TABLE_MESSAGES)
    .select("*")
    .eq("job_id", loadId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getMessagesForShipment(shipmentId: string, userId: string): Promise<MtruckMessage[]> {
  const { data, error } = await supabase
    .from(TABLE_MESSAGES)
    .select("*")
    .eq("shipment_id", shipmentId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getConversation(userId1: string, userId2: string, jobId?: string): Promise<MtruckMessage[]> {
  let query = supabase
    .from(TABLE_MESSAGES)
    .select('*')
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`);
  if (jobId) query = query.eq('job_id', jobId);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function markMessagesRead(jobId: string, readerId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_MESSAGES)
    .update({ read_at: new Date().toISOString() })
    .eq("job_id", jobId)
    .eq("receiver_id", readerId)
    .is("read_at", null);
  if (error) throw new Error(`Mark read failed: ${error.message}`);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE_MESSAGES)
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}
