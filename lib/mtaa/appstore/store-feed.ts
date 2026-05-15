import { listApps } from "./registry";

export function getStoreFeed() {
  const apps = listApps();

  return apps.map(app => ({
    id: app.id,
    name: app.name,
    description: app.description,
    category: app.category,
    version: app.version,
    installable: app.installable
  }));
}
