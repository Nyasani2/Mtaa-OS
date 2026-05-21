import borderApp from "./apps/border.manifest";

export const AppStoreRegistry = {
  border: borderApp,
};

export const getApp = (id: keyof typeof AppStoreRegistry) => {
  return AppStoreRegistry[id];
};

export const listApps = () => {
  return Object.values(AppStoreRegistry);
};
