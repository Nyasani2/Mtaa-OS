'use client'
import { useEffect, useState } from 'react'
import { FeedbackTicket } from '../types/command.types'
import { fetchFeedbackTickets, createFeedbackTicket, updateTicketStatus } from '../services/feedbackService'

export function useFeedback() {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedbackTickets().then(setTickets).finally(() => setLoading(false))
  }, [])

  const create = async (ticket: Omit<FeedbackTicket, 'id' | 'created_at'>) => {
    const created = await createFeedbackTicket(ticket)
    setTickets(prev => [created, ...prev])
    return created
  }

  const updateStatus = async (id: string, status: FeedbackTicket['status']) => {
    await updateTicketStatus(id, status)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  return { tickets, loading, create, updateStatus }
}
