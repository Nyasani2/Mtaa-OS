// lib/kernel/services/rail.service.ts
import { supabase } from '@/lib/supabase';

export interface RailApp {
  id: string;
  app_id: string;
  name: string;
  display_name: string;
  description?: string;
  icon_url?: string;
  category: string;
  version: string;
  min_os_version: string;
  is_installed: boolean;
  is_system_app: boolean;
  permissions: string[];
  route_path: string;
  status: 'active' | 'deprecated' | 'beta' | 'pending_review';
  install_count: number;
  rating?: number;
  size_mb?: number;
  last_updated: string;
  created_at: string;
}

export interface RailRegistry {
  apps: RailApp[];
  categories: string[];
  systemApps: RailApp[];
  userApps: RailApp[];
  lastSync: string;
}

export class RailService {
  private static registry: RailRegistry = {
    apps: [],
    categories: [],
    systemApps: [],
    userApps: [],
    lastSync: '',
  };

  static async syncRegistry(): Promise<RailRegistry> {
    try {
      const { data, error } = await supabase
        .from('app_store_apps')
        .select('*')
        .eq('status', 'active')
        .order('install_count', { ascending: false });

      if (error) throw error;

      const apps = (data || []) as RailApp[];
      const categories = [...new Set(apps.map(a => a.category))];
      const systemApps = apps.filter(a => a.is_system_app);
      const userApps = apps.filter(a => !a.is_system_app);

      this.registry = {
        apps,
        categories,
        systemApps,
        userApps,
        lastSync: new Date().toISOString(),
      };

      return this.registry;
    } catch (err) {
      console.error('[Rail] Sync failed:', err);
      return this.registry;
    }
  }

  static getRegistry(): RailRegistry {
    return { ...this.registry };
  }

  static getAppById(appId: string): RailApp | undefined {
    return this.registry.apps.find(a => a.app_id === appId);
  }

  static getAppsByCategory(category: string): RailApp[] {
    return this.registry.apps.filter(a => a.category === category);
  }

  static async installApp(appId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_installed_apps').insert({
        user_id: userId,
        app_id: appId,
        installed_at: new Date().toISOString(),
        is_active: true,
      });
      if (error) throw error;

      // Update install count
      await supabase.rpc('increment_app_installs', { p_app_id: appId });

      return true;
    } catch (err) {
      console.error('[Rail] Install failed:', err);
      return false;
    }
  }

  static async uninstallApp(appId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_installed_apps')
        .update({ is_active: false, uninstalled_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('app_id', appId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[Rail] Uninstall failed:', err);
      return false;
    }
  }

  static async getUserInstalledApps(userId: string): Promise<RailApp[]> {
    try {
      const { data, error } = await supabase
        .from('user_installed_apps')
        .select('app_id')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (error) throw error;

      const installedIds = (data || []).map(d => d.app_id);
      return this.registry.apps.filter(a => installedIds.includes(a.app_id));
    } catch (err) {
      console.error('[Rail] Get installed failed:', err);
      return [];
    }
  }

  static async checkForUpdates(): Promise<RailApp[]> {
    try {
      const { data, error } = await supabase
        .from('app_store_apps')
        .select('*')
        .eq('status', 'active')
        .gt('last_updated', this.registry.lastSync);
      if (error) throw error;
      return (data || []) as RailApp[];
    } catch (err) {
      console.error('[Rail] Check updates failed:', err);
      return [];
    }
  }

  static getRouteForApp(appId: string): string | undefined {
    const app = this.getAppById(appId);
    return app?.route_path;
  }
}
