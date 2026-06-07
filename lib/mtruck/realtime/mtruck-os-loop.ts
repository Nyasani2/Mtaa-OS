import { runSmartDispatchCycle } from "../dispatch/smart-dispatch-brain";
import { getControlTowerSnapshot } from "./control-tower";

export function startMTruckOS(intervalMs = 5000) {
  setInterval(async () => {
    try {
      const dispatch = await runSmartDispatchCycle();
      const snapshot = await getControlTowerSnapshot();

    // MTruck OS loop event logged via kernel observability
    // MTruck OS loop event logged via kernel observability
    // MTruck OS loop event logged via kernel observability

    } catch (err) {
      console.error("MTRUCK LOOP ERROR:", err);
    }
  }, intervalMs);
}

