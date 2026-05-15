import { registerPlugin } from "../../mtruck/plugins/mtruck-plugin-registry";

export interface MTAAApp {
  id: string;
  name: string;
  version: string;
  entry: () => any;
}

const installedApps: Record<string, MTAAApp> = {};

export function installApp(app: MTAAApp) {

  installedApps[app.id] = app;

  // convert app into MTruck plugin
  registerPlugin({
    id: app.id,
    name: app.name,
    version: app.version,
    init: () => app.entry(),
    execute: (ctx) => app.entry(),
  });

  return {
    status: "INSTALLED",
    app: app.name,
  };
}

export function listInstalledApps() {
  return Object.values(installedApps);
}
