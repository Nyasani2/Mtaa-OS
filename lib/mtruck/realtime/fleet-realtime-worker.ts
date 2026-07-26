import { saveFleetSnapshot } from "../intelligence/fleet-intelligence-brain";

export function startFleetRealtimeWorker(
  intervalMs = 10000
) {

    console.log("🚛 MTRUCK realtime intelligence started");

  setInterval(async () => {

    try {

      const snapshot =
        await saveFleetSnapshot();

    console.log("📡 Fleet Snapshot:", snapshot);

    } catch (error) {

      console.error(
        "❌ Fleet Worker Error:",
        error
      );

    }

  }, intervalMs);
}