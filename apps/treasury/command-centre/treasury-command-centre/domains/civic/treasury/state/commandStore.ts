import { create } from 'zustand'
import { TreasuryDashboard, TreasuryAlert, AuditLog, FeedbackTicket } from '../types/command.types'

interface CommandState {
  dashboard: TreasuryDashboard | null
  alerts: TreasuryAlert[]
  auditLogs: AuditLog[]
  feedbackTickets: FeedbackTicket[]
  activeModule: string
  setDashboard: (d: TreasuryDashboard) => void
  setAlerts: (a: TreasuryAlert[]) => void
  setAuditLogs: (l: AuditLog[]) => void
  setFeedbackTickets: (t: FeedbackTicket[]) => void
  setActiveModule: (m: string) => void
}

export const useCommandStore = create<CommandState>((set) => ({
  dashboard: null,
  alerts: [],
  auditLogs: [],
  feedbackTickets: [],
  activeModule: 'dashboard',
  setDashboard: (d) => set({ dashboard: d }),
  setAlerts: (a) => set({ alerts: a }),
  setAuditLogs: (l) => set({ auditLogs: l }),
  setFeedbackTickets: (t) => set({ feedbackTickets: t }),
  setActiveModule: (m) => set({ activeModule: m })
}))
