export const MARKETPLACE_APP = {
  id: "marketplace",
  name: "Marketplace",
  version: "1.0.0",
  category: "commerce",
  description: "Peer-to-peer marketplace with escrow protection, trust scoring, and order management.",
  entry: "(marketplace)",
  permissions: ["supabase.read", "supabase.write", "secure.storage", "notifications.push"],
  modules: ["listings", "orders", "escrow", "trust", "sell"],
  status: "stable",
  installable: true,
  entryPoints: { home: "/(os)/marketplace", browse: "/(os)/marketplace/browse", orders: "/(os)/marketplace/orders", sell: "/(os)/marketplace/sell" },
  screens: [] as any,
};
