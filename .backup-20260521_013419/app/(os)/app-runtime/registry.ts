export type OSApp = {
  id: string
  name: string
  icon: string
  route: string
  installed: boolean
}

export const APP_REGISTRY: OSApp[] = [
  {
    id: 'launcher',
    name: 'Home',
    icon: 'apps-outline',
    route: '/(os)/launcher',
    installed: true,
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: 'wallet-outline',
    route: '/(os)/apps/wallet',
    installed: true,
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'chatbubble-ellipses-outline',
    route: '/(os)/messages',
    installed: true,
  },
  {
    id: 'phone',
    name: 'Calls',
    icon: 'call-outline',
    route: '/(os)/phone',
    installed: true,
  },
  {
    id: 'files',
    name: 'Files',
    icon: 'folder-outline',
    route: '/(os)/documents',
    installed: true,
  },
  {
    id: 'gallery',
    name: 'Gallery',
    icon: 'images-outline',
    route: '/(os)/gallery',
    installed: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'settings-outline',
    route: '/(os)/settings',
    installed: true,
  },
  {
    id: 'store',
    name: 'App Store',
    icon: 'grid-outline',
    route: '/(os)/app-store',
    installed: true,
  },
]

export function getInstalledApps() {
  return APP_REGISTRY.filter(app => app.installed)
}

export function getAppById(id: string) {
  return APP_REGISTRY.find(app => app.id === id)
}
