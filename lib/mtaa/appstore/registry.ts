import { MTRUCK_APP } from "./apps/mtruck/manifest";

export const APP_REGISTRY = [
  MTRUCK_APP
];

export function getAppById(id: string) {
  return APP_REGISTRY.find(app => app.id === id);
}

export function listApps() {
  return APP_REGISTRY.filter(app => app.installable);
}
