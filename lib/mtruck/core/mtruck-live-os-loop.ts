import { liveDispatchCycle } from "../dispatch/mtruck-live-dispatch-stream";
import { runPredictiveBrain } from "../ai/mtruck-predictive-brain";
import { MTruckRealtimeHub } from "../realtime/mtruck-realtime-hub";

const hub = new MTruckRealtimeHub();

export function startMTruckLiveOS() {

  console.log("🚛 MTruck live OS started");

  setInterval(async () => {

    const dispatch = await liveDispatchCycle();
    const ai = await runPredictiveBrain();

    hub.emit("ai:decision", ai);

    console.log({
      dispatch,
      congestion: ai.congestion_forecast,
    });

  }, 5000);
}