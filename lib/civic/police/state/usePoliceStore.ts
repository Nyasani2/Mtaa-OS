import { create } from 'zustand'
import { PoliceCase, PoliceOfficer, EmergencyCall, CaseFilter } from '../types/police.types'

interface PoliceState {
  // Cases
  selectedCase: PoliceCase | null
  caseFilter: CaseFilter
  setSelectedCase: (caseItem: PoliceCase | null) => void
  setCaseFilter: (filter: CaseFilter) => void

  // Officers
  selectedOfficer: PoliceOfficer | null
  setSelectedOfficer: (officer: PoliceOfficer | null) => void

  // Incidents
  activeIncident: EmergencyCall | null
  setActiveIncident: (incident: EmergencyCall | null) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void

  // Notifications
  notificationPanelOpen: boolean
  setNotificationPanelOpen: (open: boolean) => void
}

export const usePoliceStore = create<PoliceState>((set) => ({
  selectedCase: null,
  caseFilter: {},
  setSelectedCase: (caseItem) => set({ selectedCase: caseItem }),
  setCaseFilter: (filter) => set({ caseFilter: filter }),

  selectedOfficer: null,
  setSelectedOfficer: (officer) => set({ selectedOfficer: officer }),

  activeIncident: null,
  setActiveIncident: (incident) => set({ activeIncident: incident }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  notificationPanelOpen: false,
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
}))
