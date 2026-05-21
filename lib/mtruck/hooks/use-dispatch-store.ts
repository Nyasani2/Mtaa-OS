import { create } from "zustand";
import { getAvailableLoads, getAssignedLoads, assignLoad as assign, unassignLoad as unassign } from "@/lib/mtruck/services/dispatch-service";
import type { Load } from "@/lib/mtruck/types";

interface DispatchState {
  availableLoads: Load[];
  assignedLoads: Load[];
  allLoads: Load[];
  assignLoad: (loadId: string) => Promise<void>;
  unassignLoad: (loadId: string) => Promise<void>;
}

export const useDispatchStore = create<DispatchState>((set, get) => ({
  availableLoads: [],
  assignedLoads: [],
  allLoads: [],
  assignLoad: async (loadId: string) => {
    await assign(loadId, "truck-1");
    const available = await getAvailableLoads();
    const assigned = await getAssignedLoads();
    set({ availableLoads: available, assignedLoads: assigned, allLoads: [...available, ...assigned] });
  },
  unassignLoad: async (loadId: string) => {
    await unassign(loadId);
    const available = await getAvailableLoads();
    const assigned = await getAssignedLoads();
    set({ availableLoads: available, assignedLoads: assigned, allLoads: [...available, ...assigned] });
  },
}));

(async () => {
  const available = await getAvailableLoads();
  const assigned = await getAssignedLoads();
  useDispatchStore.setState({ availableLoads: available, assignedLoads: assigned, allLoads: [...available, ...assigned] });
})();
