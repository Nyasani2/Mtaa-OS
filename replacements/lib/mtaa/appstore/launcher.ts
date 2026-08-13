import { getAppById } from './index';

export function launchApp(appId: string) {
  const app = getAppById(appId as any);
  if (!app) throw new Error(`App ${appId} not found`);
  return app;
}
