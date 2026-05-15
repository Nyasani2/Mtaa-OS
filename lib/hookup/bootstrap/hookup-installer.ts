export function installHookup() {

  return {
    status: "INSTALLED",
    registered_routes: true,
    db_migrations_applied: true,
    permissions_granted: true,
    ecosystem_linked: true
  };
}

export function uninstallHookup() {

  return {
    status: "REMOVED",
    cleanup: [
      "routes",
      "cache",
      "sessions",
      "live_connections"
    ]
  };
}
