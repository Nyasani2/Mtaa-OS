import { create } from "zustand";
import type { MaintenanceRecord } from "@/lib/mtruck/types";

interface MaintenanceState {
  scheduled: MaintenanceRecord[];
  overdue: MaintenanceRecord[];
  completed: MaintenanceRecord[];
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  scheduled: [
    { id: "m1", truckId: "T-001", type: "oil_change", description: "Routine oil change", scheduledDate: "2026-05-25", status: "scheduled" },
    { id: "m2", truckId: "T-003", type: "tire", description: "Tire rotation", scheduledDate: "2026-05-28", status: "scheduled" },
  ],
  overdue: [
    { id: "m3", truckId: "T-002", type: "brake", description: "Brake pad replacement", scheduledDate: "2026-05-15", status: "overdue" },
  ],
  completed: [
    { id: "m4", truckId: "T-001", type: "inspection", description: "Annual inspection", scheduledDate: "2026-05-10", completedDate: "2026-05-10", status: "completed" },
  ],
}));
