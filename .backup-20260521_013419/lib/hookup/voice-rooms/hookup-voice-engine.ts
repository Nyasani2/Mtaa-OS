export function initVoiceStream(
  room_id: string
) {

  return {
    room_id,
    stream_type: "AUDIO",
    codec: "OPUS",
    latency_mode: "LOW_LATENCY",
    status: "CONNECTED",
  };
}

export function muteUser(
  user_id: string
) {

  return {
    user_id,
    muted: true,
  };
}
