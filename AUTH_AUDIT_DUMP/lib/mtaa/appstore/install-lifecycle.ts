// lib/mtaa/appstore/install-lifecycle.ts
import { APP_REGISTRY, getAppById } from "./unified-registry";
import { supabase } from "@/lib/supabase/client";

export interface InstallResult {
  success: boolean;
  error?: string;
}

export async function installApp(appId: string): Promise<InstallResult> {
  const app = getAppById(appId);
  if (!app) {
    return { success: false, error: "App not found" };
  }
  if (app.isOSApp) {
    return { success: false, error: "OS apps cannot be installed/uninstalled" };
  }
  if (app.isInstalled) {
    return { success: false, error: "App already installed" };
  }

  // Mark as installed in registry
  app.isInstalled = true;

  // Persist to Supabase user_apps table
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("user_apps").upsert({
      user_id: user.id,
      app_id: appId,
      installed_at: new Date().toISOString(),
      version: app.version,
    });
  }

  return { success: true };
}

export async function uninstallApp(appId: string): Promise<InstallResult> {
  const app = getAppById(appId);
  if (!app) {
    return { success: false, error: "App not found" };
  }
  if (app.isOSApp) {
    return { success: false, error: "OS apps cannot be uninstalled" };
  }
  if (!app.isInstalled) {
    return { success: false, error: "App not installed" };
  }

  // Mark as uninstalled in registry
  app.isInstalled = false;

  // Remove from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("user_apps").delete().eq("user_id", user.id).eq("app_id", appId);
  }

  return { success: true };
}

export async function syncInstalledApps(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("user_apps")
    .select("app_id")
    .eq("user_id", user.id);

  if (data) {
    const installedIds = new Set(data.map((row) => row.app_id));
    for (const app of APP_REGISTRY) {
      if (!app.isOSApp) {
        app.isInstalled = installedIds.has(app.id);
      }
    }
  }
}
