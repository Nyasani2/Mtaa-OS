// lib/mtaa/appstore/unified-registry.ts
// Single source of truth for all MTAA app manifests

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  icon: string;
  route: string;
  color: string;
  size: string;
  rating: number;
  installs: number;
  isOSApp: boolean;
  isInstalled: boolean;
  section?: 'mtaa' | 'android' | 'utility';
}

export const APP_REGISTRY: AppManifest[] = [
  // === MTAA APPS (Core Platform) ===
  { id: "wallet", name: "Wallet", description: "Send, receive, store money", version: "1.0.0", category: "Finance", icon: "wallet", route: "/(os)/wallet", color: "#F59E0B", size: "12 MB", rating: 4.8, installs: 50000, isOSApp: true, isInstalled: true, section: "mtaa" },
  { id: "mtaxi", name: "mTaxi", description: "Book rides across Africa", version: "2.1.0", category: "Transport", icon: "car", route: "/(mtaxi)", color: "#10B981", size: "24 MB", rating: 4.7, installs: 125000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "civic", name: "Civic", description: "Government services", version: "1.3.0", category: "Government", icon: "shield", route: "/(civic)", color: "#3B82F6", size: "20 MB", rating: 4.1, installs: 29000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "streets", name: "Streets", description: "Navigation and maps", version: "1.7.0", category: "Navigation", icon: "map", route: "/(local)/streets", color: "#8B5CF6", size: "52 MB", rating: 4.3, installs: 43000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "health", name: "Health", description: "Healthcare services", version: "2.0.0", category: "Health", icon: "medical", route: "/(health)", color: "#EF4444", size: "38 MB", rating: 4.6, installs: 72000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "command", name: "Command", description: "Command Centre", version: "1.0.0", category: "Admin", icon: "shield-checkmark", route: "/(admin)/command-centre", color: "#06B6D4", size: "15 MB", rating: 4.5, installs: 10000, isOSApp: true, isInstalled: true, section: "mtaa" },
  { id: "shop", name: "Shop", description: "Buy and sell products", version: "2.5.0", category: "Commerce", icon: "cart", route: "/(commerce)/shop", color: "#EC4899", size: "35 MB", rating: 4.6, installs: 156000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "jobs", name: "Jobs", description: "Find work and hire", version: "1.9.0", category: "Work", icon: "briefcase", route: "/(work)/jobs", color: "#F97316", size: "22 MB", rating: 4.5, installs: 67000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "studio", name: "Studio", description: "Media studio", version: "1.0.0", category: "Media", icon: "videocam", route: "/(media)/studio", color: "#6366F1", size: "40 MB", rating: 4.4, installs: 35000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "education", name: "Edu", description: "Learn and teach", version: "1.5.0", category: "Education", icon: "school", route: "/(education)", color: "#14B8A6", size: "45 MB", rating: 4.7, installs: 54000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "marketplace", name: "Market", description: "Local marketplace", version: "2.2.0", category: "Commerce", icon: "storefront", route: "/(commerce)/marketplace", color: "#84CC16", size: "30 MB", rating: 4.4, installs: 98000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "hookup", name: "HookUp", description: "Dating and connections", version: "1.4.0", category: "Social", icon: "heart", route: "/(social)/hookup", color: "#F43F5E", size: "26 MB", rating: 4.2, installs: 38000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "mtruck", name: "MTruck", description: "Freight and logistics", version: "1.8.0", category: "Transport", icon: "bus", route: "/(mtruck)", color: "#A855F7", size: "28 MB", rating: 4.5, installs: 45000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "tribes", name: "Tribes", description: "Community groups", version: "3.0.0", category: "Social", icon: "people", route: "/(social)/tribes", color: "#D946EF", size: "32 MB", rating: 4.8, installs: 89000, isOSApp: false, isInstalled: false, section: "mtaa" },

  // === ANDROID APPS (Communication + Utilities) ===
  { id: "messages", name: "Messages", description: "SMS and chat", version: "1.0.0", category: "Communication", icon: "chatbubble", route: "/(communication)/messages", color: "#3B82F6", size: "8 MB", rating: 4.5, installs: 45000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "call", name: "Phone", description: "Calls and dialer", version: "1.0.0", category: "Communication", icon: "call", route: "/(communication)/call", color: "#22C55E", size: "6 MB", rating: 4.3, installs: 42000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "contacts", name: "Contacts", description: "Manage contacts", version: "1.0.0", category: "Communication", icon: "people", route: "/(communication)/contacts", color: "#6366F1", size: "5 MB", rating: 4.4, installs: 40000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "clock", name: "Clock", description: "Alarm, world clock, timer", version: "1.0.0", category: "Utility", icon: "time", route: "/(utility)/clock", color: "#F59E0B", size: "4 MB", rating: 4.6, installs: 38000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "calculator", name: "Calculator", description: "Basic calculator", version: "1.0.0", category: "Utility", icon: "calculator", route: "/(utility)/calculator", color: "#8B5CF6", size: "3 MB", rating: 4.2, installs: 35000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "weather", name: "Weather", description: "Local and global weather", version: "1.0.0", category: "Utility", icon: "partly-sunny", route: "/(utility)/weather", color: "#0EA5E9", size: "5 MB", rating: 4.7, installs: 36000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "time", name: "World Time", description: "Time zone converter", version: "1.0.0", category: "Utility", icon: "globe", route: "/(utility)/time", color: "#EC4899", size: "4 MB", rating: 4.1, installs: 28000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "documents", name: "Documents", description: "File manager", version: "1.0.0", category: "Productivity", icon: "folder", route: "/(productivity)/documents", color: "#64748B", size: "7 MB", rating: 4.4, installs: 32000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "gallery", name: "Gallery", description: "Photos and albums", version: "1.0.0", category: "Media", icon: "images", route: "/(media)/gallery", color: "#EF4444", size: "9 MB", rating: 4.6, installs: 41000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "scheduler", name: "Scheduler", description: "Calendar and events", version: "1.0.0", category: "Productivity", icon: "calendar", route: "/(productivity)/scheduler", color: "#14B8A6", size: "6 MB", rating: 4.3, installs: 29000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "sim", name: "SIM", description: "Airtime and data", version: "1.0.0", category: "Utility", icon: "phone-portrait", route: "/(utility)/sim", color: "#F97316", size: "5 MB", rating: 4.5, installs: 33000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "recents", name: "Recents", description: "Activity feed", version: "1.0.0", category: "System", icon: "time", route: "/(system)/recents", color: "#94A3B8", size: "3 MB", rating: 4.0, installs: 25000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "settings", name: "Settings", description: "System settings", version: "1.0.0", category: "System", icon: "settings", route: "/(os)/settings", color: "#64748B", size: "5 MB", rating: 4.4, installs: 48000, isOSApp: true, isInstalled: true, section: "android" },
  { id: "credit", name: "Credit", description: "Credit and loans", version: "1.0.0", category: "Finance", icon: "card", route: "/(finance)/credit", color: "#10B981", size: "10 MB", rating: 4.3, installs: 25000, isOSApp: false, isInstalled: false, section: "android" },
  { id: "binance", name: "Binance", description: "Crypto trading", version: "1.0.0", category: "Finance", icon: "logo-bitcoin", route: "/(finance)/binance", color: "#F0B90B", size: "18 MB", rating: 4.5, installs: 60000, isOSApp: false, isInstalled: false, section: "android" },

  // === ADDITIONAL APPS ===
  { id: "ads", name: "Ads Engine", description: "Advertising platform", version: "1.2.0", category: "Business", icon: "megaphone", route: "/(business)/ads", color: "#F97316", size: "18 MB", rating: 4.0, installs: 22000, isOSApp: false, isInstalled: false, section: "mtaa" },
  { id: "boda", name: "Boda", description: "Boda boda rides", version: "1.0.0", category: "Transport", icon: "bicycle", route: "/(boda)", color: "#22C55E", size: "15 MB", rating: 4.4, installs: 55000, isOSApp: false, isInstalled: false, section: "mtaa" },
];

export function getAppById(id: string): AppManifest | undefined {
  return APP_REGISTRY.find((app) => app.id === id);
}

export function getAppsByCategory(category: string): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.category === category);
}

export function getInstalledApps(): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.isInstalled);
}

export function getInstallableApps(): AppManifest[] {
  return APP_REGISTRY.filter((app) => !app.isOSApp && !app.isInstalled);
}

export function getAppsBySection(section: 'mtaa' | 'android' | 'utility'): AppManifest[] {
  return APP_REGISTRY.filter((app) => app.section === section && (app.isInstalled || app.isOSApp));
}

export function searchApps(query: string): AppManifest[] {
  const q = query.toLowerCase();
  return APP_REGISTRY.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
  );
}
