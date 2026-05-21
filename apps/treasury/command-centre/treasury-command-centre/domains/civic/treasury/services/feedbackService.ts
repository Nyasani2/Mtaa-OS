import { supabase } from '@/lib/supabase/client'
import { FeedbackTicket } from '../types/command.types'

export async function fetchFeedbackTickets(): Promise<FeedbackTicket[]> {
  const { data, error } = await supabase
    .from('treasury_feedback_tickets')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createFeedbackTicket(
  ticket: Omit<FeedbackTicket, 'id' | 'created_at'>
): Promise<FeedbackTicket> {
  const { data, error } = await supabase
    .from('treasury_feedback_tickets')
    .insert(ticket)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTicketStatus(
  ticketId: string,
  status: FeedbackTicket['status']
): Promise<void> {
  const updates: Record<string, string> = { status }
  if (status === 'resolved') updates.resolved_at = new Date().toISOString()
  const { error } = await supabase
    .from('treasury_feedback_tickets')
    .update(updates)
    .eq('id', ticketId)
  if (error) throw error
}
