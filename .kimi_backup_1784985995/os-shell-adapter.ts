export interface OSShellAdapter {
  launchApp: (appId: string, params?: Record<string, any>) => Promise<boolean>;
  closeApp: (appId: string) => Promise<boolean>;
  getRunningApps: () => Promise<string[]>;
}

export const osShellAdapter: OSShellAdapter = {
  async launchApp(appId: string, params?: Record<string, any>) {
    console.warn('OSShellAdapter.launchApp not implemented');
    return false;
  },
  async closeApp(appId: string) {
    console.warn('OSShellAdapter.closeApp not implemented');
    return false;
  },
  async getRunningApps() {
    console.warn('OSShellAdapter.getRunningApps not implemented');
    return [];
  },
};
