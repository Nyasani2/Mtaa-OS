export const SETTINGS_APP = {
  id: "settings",
  name: "Settings",
  version: "1.0.0",
  category: "system",
  description: "System settings, security, privacy, API keys, and network configuration.",
  entry: "(settings)",
  permissions: ["secure.storage", "biometric.read", "notifications.push"],
  modules: ["profile", "security", "privacy", "notifications", "network", "api-keys"],
  status: "stable",
  installable: false,
  entryPoints: {
    home: "/(settings)",
    security: "/(settings)/change-password",
    privacy: "/(settings)/privacy",
    notifications: "/(settings)/app-notifications",
    network: "/(settings)/network",
    apiKeys: "/(settings)/api-keys",
  }
};
