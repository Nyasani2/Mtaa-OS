export function syncIdentityAcrossApps(
  passport_id: string,
  app: string
) {

  return {
    passport_id,
    linked_app: app,
    status: "SYNCED",
    timestamp: Date.now(),
  };
}
