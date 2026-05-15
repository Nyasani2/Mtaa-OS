export function generateRoomKey(
  user_a: string,
  user_b: string
) {

  return btoa(
    `${user_a}-${user_b}-${Date.now()}`
  );
}

export function rotateKey(
  old_key: string
) {

  return btoa(
    old_key + "-rotated"
  );
}
