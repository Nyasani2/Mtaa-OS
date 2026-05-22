import { getUnifiedRegistry } from "./registry";

const iconMap: Record<string, string> = {
  mtaxi: "car",
  mtruck: "truck",
  hookup: "heart",
  health: "heart-pulse",
  wallet: "wallet",
  settings: "settings",
  credit: "credit-card",
  jobs: "briefcase",
  marketplace: "shopping-bag",
  shop: "store",
  streets: "map-pin",
  tribes: "users",
  education: "graduation-cap",
  civic: "landmark",
  documents: "file-text",
  gallery: "image",
  messages: "message-circle",
  clock: "clock",
  scheduler: "calendar",
  sim: "sim-card",
  recents: "history",
  binance: "bitcoin",
  ads: "megaphone",
  analytics: "bar-chart-2",
};

const colorMap: Record<string, string> = {
  mtaxi: "#4F46E5",
  mtruck: "#059669",
  hookup: "#EC4899",
  health: "#DC2626",
  wallet: "#D97706",
  settings: "#6B7280",
  credit: "#7C3AED",
  jobs: "#0369A1",
  marketplace: "#C2410C",
  shop: "#BE185D",
  streets: "#15803D",
  tribes: "#A16207",
  education: "#4338CA",
  civic: "#1E40AF",
  documents: "#52525B",
  gallery: "#0891B2",
  messages: "#2563EB",
  clock: "#52525B",
  scheduler: "#7C3AED",
  sim: "#059669",
  recents: "#6B7280",
  binance: "#F59E0B",
  ads: "#DB2777",
  analytics: "#4F46E5",
};

export function getLaunchRoute(appId: string): string | null {
  const app = getUnifiedRegistry().find(a => a.id === appId);
  return app?.route || null;
}

export function canLaunch(appId: string): boolean {
  return !!getLaunchRoute(appId);
}

export function getAppIcon(appId: string): string {
  return iconMap[appId] || "apps";
}

export function getAppColor(appId: string): string {
  return colorMap[appId] || "#6366F1";
}
