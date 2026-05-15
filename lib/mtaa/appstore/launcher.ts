import { getAppById } from "./registry";

export function launchApp(appId: string) {
  const app = getAppById(appId);

  if (!app) throw new Error("APP_NOT_FOUND");

  return {
    route: app.entry,
    modules: app.modules,
    permissions: app.permissions
  };
}
