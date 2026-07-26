import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface AppLayoutItem {
  id: string;
  appId: string;
  appName: string;
  appIcon: string;
  appRoute: string;
  positionX: number;
  positionY: number;
  pageNumber: number;
  folderId: string | null;
  isHidden: boolean;
  isPinned: boolean;
}

export interface AppFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  positionX: number;
  positionY: number;
  pageNumber: number;
}

export interface HomeWidget {
  id: string;
  widgetType: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  config: Record<string, any>;
}

export interface HomeSettings {
  wallpaperUrl: string;
  wallpaperType: string;
  blurStrength: number;
  theme: string;
  showDock: boolean;
  dockApps: string[];
}

interface HomeState {
  // Settings
  settings: HomeSettings;
  setSettings: (s: Partial<HomeSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;

  // Layouts
  layouts: AppLayoutItem[];
  folders: AppFolder[];
  widgets: HomeWidget[];
  setLayouts: (l: AppLayoutItem[]) => void;
  setFolders: (f: AppFolder[]) => void;
  setWidgets: (w: HomeWidget[]) => void;
  loadLayouts: () => Promise<void>;
  saveLayout: (item: AppLayoutItem) => Promise<void>;
  createFolder: (name: string, apps: string[]) => Promise<void>;
  moveAppToFolder: (appId: string, folderId: string | null) => Promise<void>;

  // Edit mode
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;

  // Long press menu
  selectedApp: AppLayoutItem | null;
  setSelectedApp: (app: AppLayoutItem | null) => void;
  showMenu: boolean;
  setShowMenu: (v: boolean) => void;

  // Wallpaper picker
  showWallpaperPicker: boolean;
  setShowWallpaperPicker: (v: boolean) => void;

  // Widget picker
  showWidgetPicker: boolean;
  setShowWidgetPicker: (v: boolean) => void;

  // Drag state
  draggingAppId: string | null;
  setDraggingAppId: (id: string | null) => void;

  // Analytics
  trackAppOpen: (appId: string) => Promise<void>;

  // Role-based home
  userRole: string;
  setUserRole: (role: string) => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  settings: {
    wallpaperUrl: '/assets/images/mtaa_home.png',
    wallpaperType: 'default',
    blurStrength: 40,
    theme: 'dark',
    showDock: true,
    dockApps: ['phone', 'messages', 'wallet', 'profile', 'search'],
  },
  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),

  loadSettings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_home_settings').select('*').eq('user_id', user.id).single();
    if (data) {
      set({
        settings: {
          wallpaperUrl: data.wallpaper_url,
          wallpaperType: data.wallpaper_type,
          blurStrength: data.blur_strength,
          theme: data.theme,
          showDock: data.show_dock,
          dockApps: data.dock_apps,
        },
      });
    }
  },

  saveSettings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { settings } = get();
    await supabase.from('user_home_settings').upsert({
      user_id: user.id,
      wallpaper_url: settings.wallpaperUrl,
      wallpaper_type: settings.wallpaperType,
      blur_strength: settings.blurStrength,
      theme: settings.theme,
      show_dock: settings.showDock,
      dock_apps: settings.dockApps,
    });
  },

  layouts: [],
  folders: [],
  widgets: [],
  setLayouts: (l) => set({ layouts: l }),
  setFolders: (f) => set({ folders: f }),
  setWidgets: (w) => set({ widgets: w }),

  loadLayouts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: layouts }, { data: folders }, { data: widgets }] = await Promise.all([
      supabase.from('user_app_layouts').select('*').eq('user_id', user.id).eq('is_hidden', false),
      supabase.from('user_app_folders').select('*').eq('user_id', user.id),
      supabase.from('user_home_widgets').select('*').eq('user_id', user.id),
    ]);
    if (layouts) set({ layouts: layouts.map((l: any) => ({
      id: l.id, appId: l.app_id, appName: l.app_name, appIcon: l.app_icon,
      appRoute: l.app_route, positionX: l.position_x, positionY: l.position_y,
      pageNumber: l.page_number, folderId: l.folder_id, isHidden: l.is_hidden, isPinned: l.is_pinned,
    })) });
    if (folders) set({ folders: folders.map((f: any) => ({
      id: f.id, name: f.name, icon: f.icon, color: f.color,
      positionX: f.position_x, positionY: f.position_y, pageNumber: f.page_number,
    })) });
    if (widgets) set({ widgets: widgets.map((w: any) => ({
      id: w.id, widgetType: w.widget_type, positionX: w.position_x, positionY: w.position_y,
      width: w.width, height: w.height, config: w.config,
    })) });
  },

  saveLayout: async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_app_layouts').upsert({
      user_id: user.id,
      app_id: item.appId,
      app_name: item.appName,
      app_icon: item.appIcon,
      app_route: item.appRoute,
      position_x: item.positionX,
      position_y: item.positionY,
      page_number: item.pageNumber,
      folder_id: item.folderId,
      is_hidden: item.isHidden,
      is_pinned: item.isPinned,
    });
  },

  createFolder: async (name, appIds) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: folder } = await supabase.from('user_app_folders').insert({
      user_id: user.id, name, icon: 'folder', color: '#6366f1',
    }).select().single();
    if (folder) {
      await supabase.from('user_app_layouts').update({ folder_id: folder.id }).in('app_id', appIds).eq('user_id', user.id);
      await get().loadLayouts();
    }
  },

  moveAppToFolder: async (appId, folderId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_app_layouts').update({ folder_id: folderId }).eq('app_id', appId).eq('user_id', user.id);
    await get().loadLayouts();
  },

  isEditMode: false,
  setEditMode: (v) => set({ isEditMode: v }),

  selectedApp: null,
  setSelectedApp: (app) => set({ selectedApp: app }),
  showMenu: false,
  setShowMenu: (v) => set({ showMenu: v }),

  showWallpaperPicker: false,
  setShowWallpaperPicker: (v) => set({ showWallpaperPicker: v }),

  showWidgetPicker: false,
  setShowWidgetPicker: (v) => set({ showWidgetPicker: v }),

  draggingAppId: null,
  setDraggingAppId: (id) => set({ draggingAppId: id }),

  trackAppOpen: async (appId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('home_analytics').insert({
      user_id: user.id, app_id: appId, session_start: new Date().toISOString(),
    });
  },

  userRole: 'general',
  setUserRole: (role) => set({ userRole: role }),
}));
