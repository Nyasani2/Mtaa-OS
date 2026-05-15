import { AppRegistry, InstalledAppV2 } from "./app-registry";

export type AppItem = InstalledAppV2;

const installedAt = new Date().toISOString();

export const defaultApps: AppItem[] = [
  {
    id: "streets",
    name: "Streets",
    icon: "play-circle",
    route: "/streets",
    color: "#ff375f",
    category: "social",
    version: "1.0.0",
    description: "Social feed, video, live & chat",
    installedAt,
  },
];

export function useOS() {
  const registry = new AppRegistry();

  defaultApps.forEach(app => registry.register(app));

  return {
    apps: registry.getApps(),
  };
}
