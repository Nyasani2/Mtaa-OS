export function syncDeliveryToHookup(
  user_id: string,
  delivery_id: string
) {

  return {
    user_id,
    source_app: "MTRUCK",
    event_type: "DELIVERY",
    linked_entity_id: delivery_id,
  };
}
