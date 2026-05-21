export function initVoiceRoom(
  room_id: string,
  user_id: string
) {

  // WebRTC placeholder layer
  // (real signaling later via Supabase Realtime)

  return {
    room_id,
    user_id,
    status: "CONNECTED",
  };
}

export function muteMicrophone() {
  return {
    mic: "muted",
  };
}

export function unmuteMicrophone() {
  return {
    mic: "active",
  };
}
