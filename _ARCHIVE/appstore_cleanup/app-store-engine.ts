import { supabase } from '@/lib/supabase'

export type InstalledApp = {
  id: string
  name: string
  route: string
  icon: string
  version: string
  installed: boolean
  system: boolean
  description?: string
  updated_at?: string
}

export const SYSTEM_APPS: InstalledApp[] = [
  {
    id: 'wallet',
    name: 'Wallet',
    route: '/(os)/wallet',
    icon: 'wallet',
    version: '1.0.0',
    installed: true,
    system: true,
    description: 'OS financial runtime',
  },

  {
    id: 'messages',
    name: 'Messenger',
    route: '/(os)/messages',
    icon: 'messages',
    version: '1.0.0',
    installed: true,
    system: true,
    description: 'Messaging runtime',
  },

  {
    id: 'phone',
    name: 'Call',
    route: '/(os)/phone',
    icon: 'phone',
    version: '1.0.0',
    installed: true,
    system: true,
    description: 'SIM and call runtime',
  },

  {
    id: 'documents',
    name: 'Files',
    route: '/(os)/documents',
    icon: 'folder',
    version: '1.0.0',
    installed: true,
    system: true,
    description: 'File manager',
  },

  {
    id: 'gallery',
    name: 'Gallery',
    route: '/(os)/gallery',
    icon: 'gallery',
    version: '1.0.0',
    installed: true,
    system: true,
    description: 'Media browser',
  },

  {
    id: 'settings',
    name: 'Settings',
    route: '/(os)/settings',
    icon: 'settings',
    version: '1.0.0',
    installed: true,
    system: true,
    description: 'OS settings',
  },
]

export const STORE_APPS: InstalledApp[] = [
  {
    id: 'mtaxi',
    name: 'MTAXI',
    route: '/(os)/mtaxi',
    icon: 'car',
    version: '0.0.1',
    installed: false,
    system: false,
    description: 'Transport platform',
  },

  {
    id: 'mtruck',
    name: 'MTruck',
    route: '/(os)/mtruck',
    icon: 'truck',
    version: '0.0.1',
    installed: false,
    system: false,
    description: 'Fleet logistics',
  },

  {
    id: 'marketplace',
    name: 'Marketplace',
    route: '/(os)/marketplace',
    icon: 'shopping-bag',
    version: '0.0.1',
    installed: false,
    system: false,
    description: 'Commerce ecosystem',
  },

  {
    id: 'tribes',
    name: 'Tribes',
    route: '/(os)/tribes',
    icon: 'users',
    version: '0.0.1',
    installed: false,
    system: false,
    description: 'Communities and identity',
  },
]

export async function bootstrapAppStore(userId: string) {
  try {
    const { data } = await supabase
      .from('os_installed_apps')
      .select('*')
      .eq('user_id', userId)

    if (data && data.length > 0) {
      return data
    }

    const payload = SYSTEM_APPS.map(app => ({
      user_id: userId,
      app_id: app.id,
      name: app.name,
      route: app.route,
      icon: app.icon,
      version: app.version,
      installed: true,
      system: true,
      description: app.description,
    }))

    const { error } = await supabase
      .from('os_installed_apps')
      .insert(payload)

    if (error) {
      console.error(error)
    }

    return payload
  } catch (e) {
    console.error(e)
    return []
  }
}

export async function getInstalledApps(userId: string) {
  const { data, error } = await supabase
    .from('os_installed_apps')
    .select('*')
    .eq('user_id', userId)
    .eq('installed', true)
    .order('name')

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

export async function installApp(
  userId: string,
  app: InstalledApp
) {
  const payload = {
    user_id: userId,
    app_id: app.id,
    name: app.name,
    route: app.route,
    icon: app.icon,
    version: app.version,
    installed: true,
    system: false,
    description: app.description,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('os_installed_apps')
    .upsert(payload)

  if (error) {
    console.error(error)
    return false
  }

  return true
}

export async function uninstallApp(
  userId: string,
  appId: string
) {
  const { error } = await supabase
    .from('os_installed_apps')
    .update({
      installed: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('app_id', appId)

  if (error) {
    console.error(error)
    return false
  }

  return true
}

export async function checkForUpdates(userId: string) {
  const { data } = await supabase
    .from('os_installed_apps')
    .select('*')
    .eq('user_id', userId)

  if (!data) {
    return []
  }

  return data.map(app => ({
    ...app,
    update_available: true,
    latest_version: incrementVersion(app.version || '0.0.1'),
  }))
}

export function incrementVersion(version: string) {
  const parts = version.split('.').map(Number)

  parts[2] += 1

  return parts.join('.')
}
