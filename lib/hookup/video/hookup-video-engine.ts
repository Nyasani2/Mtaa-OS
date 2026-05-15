export function initVideoRoom(
  room_id: string,
  user_id: string
) {

  // WebRTC video session placeholder
  // Will later connect to signaling server

  return {
    room_id,
    user_id,
    video: "CONNECTED",
  };
}

export function toggleCamera(
  enabled: boolean
) {

  return {
    camera: enabled
      ? "ON"
      : "OFF",
  };
}
