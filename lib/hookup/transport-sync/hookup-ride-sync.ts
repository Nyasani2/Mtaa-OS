export function syncRideToHookup(
  user_id: string,
  ride_id: string,
  status: string
) {

  return {
    user_id,
    source_app: "MTAXI",
    event_type: "RIDE",
    linked_entity_id: ride_id,
    status,
  };
}
