import { getAppById, isSystemApp, isLocalApp } from "./registry";

// ============================================
// APP LAUNCHER
// Routes to any installed app by ID
// ============================================

export function getLaunchRoute(appId: string, entryPoint?: string): string | null {
  const app = getAppById(appId);
  if (!app) return null;

  // Use specified entry point or default home
  if (entryPoint && app.entryPoints?.[entryPoint]) {
    return app.entryPoints[entryPoint];
  }

  return app.entryPoints?.home || `/${app.entry}`;
}

export function canLaunch(appId: string): boolean {
  const app = getAppById(appId);
  if (!app) return false;

  // System apps are always launchable
  if (isSystemApp(appId)) return true;

  // Local apps need installation check (could check Supabase user_apps table)
  if (isLocalApp(appId)) return true; // For now, local apps are always available

  // Remote apps need to be installed
  return app.installed === true;
}

export function getAppIcon(appId: string): string {
  const icons: Record<string, string> = {
    mtruck: "truck",
    hookup: "heart",
    health: "medical",
    wallet: "wallet",
    settings: "cog",
  };
  return icons[appId] || "app";
}

export function getAppColor(appId: string): string {
  const colors: Record<string, string> = {
    mtruck: "#F59E0B",
    hookup: "#EC4899",
    health: "#10B981",
    wallet: "#3B82F6",
    settings: "#6B7280",
  };
  return colors[appId] || "#6366F1";
}
