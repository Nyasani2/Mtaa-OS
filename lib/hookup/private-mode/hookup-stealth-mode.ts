export function enableStealthMode(
  user_settings: any
) {

  return {
    hidden_from_discovery: true,
    no_last_seen: true,
    no_online_status: true,
    private_profile_only: true,
    ghost_mode: true,
  };
}
