import { emitGlobalEvent } from "../../mtruck/bus/mtaa-interapp-bus";
import { computeCrossBorderRoute } from "./africa-mobility-grid";
import { predictBorderDelay } from "./border-intelligence-engine";

export async function dispatchCrossBorderCargo(payload: any) {

  const delay = await predictBorderDelay(
    payload.origin_country,
    payload.destination_country
  );

  const route = await computeCrossBorderRoute({
    ...payload,
    distance_km: payload.distance_km,
    risk_level: payload.risk_level,
    border_delay_hours: delay.estimated_delay_hours,
  });

  emitGlobalEvent({
    type: "MTRUCK:DISPATCH",
    payload: route,
    timestamp: new Date().toISOString(),
  });

  return {
    status: "CROSS_BORDER_DISPATCHED",
    route,
  };
}
