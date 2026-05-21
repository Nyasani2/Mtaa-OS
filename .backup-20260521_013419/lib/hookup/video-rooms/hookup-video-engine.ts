export function initVideoStream(
  room_id: string
) {

  return {
    room_id,
    stream_type: "VIDEO",
    resolution: "720p",
    fps: 30,
    encryption: "E2E_ENABLED",
    status: "CONNECTED",
  };
}

export function toggleCamera(
  user_id: string,
  state: boolean
) {

  return {
    user_id,
    camera_on: state,
  };
}
