export function encryptMessage(
  message: string,
  key: string
) {

  // placeholder encryption (replace with AES-256 later)

  return btoa(
    key + "::" + message
  );
}

export function decryptMessage(
  encrypted: string,
  key: string
) {

  const decoded = atob(encrypted);

  return decoded.replace(
    key + "::",
    ""
  );
}
