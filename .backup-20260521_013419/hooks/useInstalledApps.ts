export function useInstalledApps() {
  return {
    isLoading: false,
    apps: [
      { id: "1", name: "Home", domain: "home", icon: "🏠", color: "#3b82f6", systemApp: true },
      { id: "2", name: "Wallet", domain: "wallet", icon: "💰", color: "#10b981", systemApp: true },
    ],
  };
}
