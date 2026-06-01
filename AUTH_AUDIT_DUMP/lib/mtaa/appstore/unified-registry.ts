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
}

export const APP_REGISTRY: AppManifest[] = [
  // OS Apps (pre-installed)
  { id: "wallet", name: "Wallet", description: "Send, receive, store money", version: "1.0.0", category: "Finance", icon: "wallet", route: "/wallet", color: "#10B981", size: "12 MB", rating: 4.8, installs: 50000, isOSApp: true, isInstalled: true },
  { id: "messages", name: "Messages", description: "SMS and chat", version: "1.0.0", category: "Communication", icon: "chatbubble", route: "/communication/messages", color: "#3B82F6", size: "8 MB", rating: 4.5, installs: 45000, isOSApp: true, isInstalled: true },
  { id: "call", name: "Phone", description: "Calls and dialer", version: "1.0.0", category: "Communication", icon: "call", route: "/communication/call", color: "#22C55E", size: "6 MB", rating: 4.3, installs: 42000, isOSApp: true, isInstalled: true },
  { id: "contacts", name: "Contacts", description: "Manage contacts", version: "1.0.0", category: "Communication", icon: "people", route: "/communication/contacts", color: "#6366F1", size: "5 MB", rating: 4.4, installs: 40000, isOSApp: true, isInstalled: true },
  { id: "clock", name: "Clock", description: "Alarm, world clock, timer", version: "1.0.0", category: "Utility", icon: "time", route: "/utility/clock", color: "#F59E0B", size: "4 MB", rating: 4.6, installs: 38000, isOSApp: true, isInstalled: true },
  { id: "calculator", name: "Calculator", description: "Basic calculator", version: "1.0.0", category: "Utility", icon: "calculator", route: "/utility/calculator", color: "#8B5CF6", size: "3 MB", rating: 4.2, installs: 35000, isOSApp: true, isInstalled: true },
  { id: "weather", name: "Weather", description: "Local and global weather", version: "1.0.0", category: "Utility", icon: "partly-sunny", route: "/utility/weather", color: "#0EA5E9", size: "5 MB", rating: 4.7, installs: 36000, isOSApp: true, isInstalled: true },
  { id: "time", name: "World Time", description: "Time zone converter", version: "1.0.0", category: "Utility", icon: "globe", route: "/utility/time", color: "#EC4899", size: "4 MB", rating: 4.1, installs: 28000, isOSApp: true, isInstalled: true },
  { id: "documents", name: "Documents", description: "File manager", version: "1.0.0", category: "Productivity", icon: "folder", route: "/productivity/documents", color: "#64748B", size: "7 MB", rating: 4.4, installs: 32000, isOSApp: true, isInstalled: true },
  { id: "gallery", name: "Gallery", description: "Photos and albums", version: "1.0.0", category: "Media", icon: "images", route: "/media/gallery", color: "#EF4444", size: "9 MB", rating: 4.6, installs: 41000, isOSApp: true, isInstalled: true },
  { id: "scheduler", name: "Scheduler", description: "Calendar and events", version: "1.0.0", category: "Productivity", icon: "calendar", route: "/productivity/scheduler", color: "#14B8A6", size: "6 MB", rating: 4.3, installs: 29000, isOSApp: true, isInstalled: true },
  { id: "sim", name: "SIM Manager", description: "Airtime and data", version: "1.0.0", category: "Utility", icon: "phone-portrait", route: "/utility/sim", color: "#F97316", size: "5 MB", rating: 4.5, installs: 33000, isOSApp: true, isInstalled: true },
  { id: "recents", name: "Recents", description: "Activity feed", version: "1.0.0", category: "System", icon: "time", route: "/system/recents", color: "#94A3B8", size: "3 MB", rating: 4.0, installs: 25000, isOSApp: true, isInstalled: true },
  { id: "settings", name: "Settings", description: "System settings", version: "1.0.0", category: "System", icon: "settings", route: "/settings", color: "#64748B", size: "5 MB", rating: 4.4, installs: 48000, isOSApp: true, isInstalled: true },

  // Installable Apps
  { id: "mtaxi", name: "MTaxi", description: "Book rides across Africa", version: "2.1.0", category: "Transport", icon: "car", route: "/mtaxi", color: "#F59E0B", size: "24 MB", rating: 4.7, installs: 125000, isOSApp: false, isInstalled: false },
  { id: "mtruck", name: "MTruck", description: "Freight and logistics", version: "1.8.0", category: "Transport", icon: "bus", route: "/mtruck", color: "#8B5CF6", size: "28 MB", rating: 4.5, installs: 45000, isOSApp: false, isInstalled: false },
  { id: "tribes", name: "Tribes", description: "Community groups", version: "3.0.0", category: "Social", icon: "people", route: "/tribes", color: "#10B981", size: "32 MB", rating: 4.8, installs: 89000, isOSApp: false, isInstalled: false },
  { id: "shop", name: "Shop", description: "Buy and sell products", version: "2.5.0", category: "Commerce", icon: "cart", route: "/shop", color: "#EC4899", size: "35 MB", rating: 4.6, installs: 156000, isOSApp: false, isInstalled: false },
  { id: "marketplace", name: "Marketplace", description: "Local marketplace", version: "2.2.0", category: "Commerce", icon: "storefront", route: "/marketplace", color: "#0EA5E9", size: "30 MB", rating: 4.4, installs: 98000, isOSApp: false, isInstalled: false },
  { id: "jobs", name: "Jobs", description: "Find work and hire", version: "1.9.0", category: "Work", icon: "briefcase", route: "/jobs", color: "#6366F1", size: "22 MB", rating: 4.5, installs: 67000, isOSApp: false, isInstalled: false },
  { id: "education", name: "Education", description: "Learn and teach", version: "1.5.0", category: "Education", icon: "school", route: "/education", color: "#14B8A6", size: "45 MB", rating: 4.7, installs: 54000, isOSApp: false, isInstalled: false },
  { id: "health", name: "Health", description: "Healthcare services", version: "2.0.0", category: "Health", icon: "medical", route: "/health", color: "#EF4444", size: "38 MB", rating: 4.6, installs: 72000, isOSApp: false, isInstalled: false },
  { id: "streets", name: "Streets", description: "Navigation and maps", version: "1.7.0", category: "Navigation", icon: "map", route: "/streets", color: "#22C55E", size: "52 MB", rating: 4.3, installs: 43000, isOSApp: false, isInstalled: false },
  { id: "hookup", name: "HookUp", description: "Dating and connections", version: "1.4.0", category: "Social", icon: "heart", route: "/hookup", color: "#F43F5E", size: "26 MB", rating: 4.2, installs: 38000, isOSApp: false, isInstalled: false },
  { id: "civic", name: "Civic", description: "Government services", version: "1.3.0", category: "Government", icon: "shield", route: "/civic", color: "#1E40AF", size: "20 MB", rating: 4.1, installs: 29000, isOSApp: false, isInstalled: false },
  { id: "ads", name: "Ads Engine", description: "Advertising platform", version: "1.2.0", category: "Business", icon: "megaphone", route: "/ads", color: "#F97316", size: "18 MB", rating: 4.0, installs: 22000, isOSApp: false, isInstalled: false },
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

export function searchApps(query: string): AppManifest[] {
  const q = query.toLowerCase();
  return APP_REGISTRY.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
  );
}
