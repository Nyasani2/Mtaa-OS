import { saveFleetSnapshot } from "../intelligence/fleet-intelligence-brain";

export function startFleetRealtimeWorker(
  intervalMs = 10000
) {

    // Fleet realtime event logged via kernel observability
    "🚛 MTRUCK realtime intelligence started"
  );

  setInterval(async () => {

    try {

      const snapshot =
        await saveFleetSnapshot();

    // Fleet realtime event logged via kernel observability
        "📡 Fleet Snapshot:",
        snapshot
      );

    } catch (error) {

      console.error(
        "❌ Fleet Worker Error:",
        error
      );

    }

  }, intervalMs);
}

