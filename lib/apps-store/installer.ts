import { getAppById } from "./registry";

export async function installApp(appId: string) {
  const app = getAppById(appId);

  if (!app) throw new Error("APP_NOT_FOUND");

  return {
    status: "INSTALLED",
    app: {
      id: app.id,
      version: app.version,
      entry: app.entry
    }
  };
}

export async function uninstallApp(appId: string) {
  return {
    status: "REMOVED",
    appId
  };
}
