export function evaluateRoomRules(
  room_settings: any
) {

  return {
    allow_links: false,
    allow_money_requests: false,
    allow_screen_sharing: true,
    allow_anonymous: true,
    strict_identity_mode:
      room_settings.is_private,
  };
}
