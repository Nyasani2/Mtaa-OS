import { runSmartDispatchCycle } from "../dispatch/smart-dispatch-brain";
import { getControlTowerSnapshot } from "./control-tower";

export function startMTruckOS(intervalMs = 5000) {
  setInterval(async () => {
    try {
      const dispatch = await runSmartDispatchCycle();
      const snapshot = await getControlTowerSnapshot();

      console.log("🚛 MTRUCK LOOP");
      console.log("Dispatch:", dispatch);
      console.log("Fleet:", snapshot);

    } catch (err) {
      console.error("MTRUCK LOOP ERROR:", err);
    }
  }, intervalMs);
}
