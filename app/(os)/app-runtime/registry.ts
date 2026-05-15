export type MTAAApp = {
  id: string
  name: string
  icon: string
  route: string
  system?: boolean
  installed?: boolean
  permissions?: string[]
}

export const appRegistry: MTAAApp[] = [
  {
    name: 'Wallet',
    system: true,
    installed: true,
    permissions: ['payments'],
  },
  {
    id: 'appstore',
    name: 'App Store',
    icon: 'grid-outline',
    route: '/(os)/apps/store',
    system: true,
    installed: true,
  },
  {
    id: 'civic',
    name: 'Civic',
    icon: 'business-outline',
    route: '/(os)/apps/civic',
    installed: true,
  },
  {
    id: 'streets',
    name: 'Streets',
    icon: 'map-outline',
    route: '/(os)/apps/streets',
    installed: true,
  },
  {
    id: 'mtaxi',
    name: 'MTAXI',
    icon: 'car-outline',
    route: '/(os)/apps/mtaxi',
    installed: true,
  },
  {
    id: 'hookup',
    name: 'Hookup',
    icon: 'people-outline',
    route: '/(os)/apps/hookup',
    installed: true,
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'medkit-outline',
    route: '/(os)/apps/health',
    installed: true,
  },
]

