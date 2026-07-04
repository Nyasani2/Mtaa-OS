export const appRegistry = [
  { id: "wallet", name: "Wallet", category: "finance", enabled: true },
  { id: "health", name: "Health", category: "healthcare", enabled: true },
  { id: "streets", name: "Streets", category: "social", enabled: true },
  { id: "shop", name: "Shop", category: "commerce", enabled: true },
];

export function getEnabledApps() {
  return appRegistry.filter(app => app.enabled);
}

export function getAppsByCategory(category: string) {
  return appRegistry.filter(app => app.category === category);
}
export default function Registry() { return null; }
