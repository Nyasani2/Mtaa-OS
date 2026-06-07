import { unifiedRegistry } from './unified-registry';

export const launcher = {
  launch(appId: string) {
    const app = unifiedRegistry.getById(appId);
    if (!app) return { success: false, error: 'App not found' };
    if (!app.installed) return { success: false, error: 'App not installed' };
    return { success: true, route: app.route };
  },
  getLaunchable() {
    return unifiedRegistry.getInstalled();
  },
};

export default launcher;
