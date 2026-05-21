export function analyzeLiveness(
  image_frames: any[]
) {

  // placeholder logic for now

  const motion_detected =
    image_frames.length > 3;

  const blink_detected = true;

  const risk =
    motion_detected && blink_detected
      ? 10
      : 70;

  return {
    is_live: risk < 30,
    confidence: 100 - risk,
  };
}
