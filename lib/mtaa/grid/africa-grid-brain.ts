import { dispatchCrossBorderCargo } from "./continental-dispatch-bridge";
import { settleCrossBorderPayment } from "./currency-settlement-engine";

export async function runAfricaGridBrain() {

  const sampleCargo = {
    origin_country: "Kenya",
    destination_country: "Uganda",
    cargo_type: "FREIGHT",
    distance_km: 650,
    risk_level: "MEDIUM",
  };

  const dispatch = await dispatchCrossBorderCargo(sampleCargo);

  const settlement = await settleCrossBorderPayment(
    5000,
    "KES"
  );

  return {
    dispatch,
    settlement,
    status: "AFRICA_GRID_ACTIVE",
  };
}
