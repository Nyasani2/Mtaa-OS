// lib/mtruck/dispatch/dispatch-loop.ts
export interface DispatchJob {
  id: string;
  truckId?: string;
  status: "pending" | "assigned" | "in_transit" | "completed";
  pickup: string;
  dropoff: string;
  cargoType?: string;
}

export async function runDispatchLoop(jobs: DispatchJob[], trucks: any[]): Promise<DispatchJob[]> {
  const pending: DispatchJob[] = jobs.filter(j => j.status === "pending");

  for (const job of pending) {
    const availableTruck = trucks.find((t: any) => t.available && t.capacity >= (job.cargoType === "heavy" ? 20 : 5));
    if (availableTruck) {
      job.truckId = availableTruck.id;
      job.status = "assigned";
      availableTruck.available = false;
    }
  }

  return jobs;
}
