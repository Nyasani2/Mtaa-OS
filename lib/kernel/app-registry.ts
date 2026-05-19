export type MTAAApp = {
  id: string;
  name: string;
  icon: string;
  route: string;
  version: string;
  status: 'stable' | 'beta' | 'coming_soon';
};

export const APP_REGISTRY: MTAAApp[] = [
  {
    id: 'feed',
    name: 'Feed',
    icon: '📰',
    route: '/(os)/feed',
    version: '1.0.0',
    status: 'stable',
  },
  {
    id: 'auth',
    name: 'Auth',
    icon: '🔐',
    route: '/(os)/auth',
    version: '1.0.0',
    status: 'stable',
  },
  {
    id: 'mtruck',
    name: 'MTruck',
    icon: '🚚',
    route: '/(os)/mtruck',
    version: '1.0.0',
    status: 'stable',
  },
  {
    id: 'mtaxi',
    name: 'MTaxi',
    icon: '🚕',
    route: '/(os)/mtaxi',
    version: '1.0.0',
    status: 'beta',
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🛒',
    route: '/(os)/shop',
    version: '1.0.0',
    status: 'stable',
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: '🏪',
    route: '/(os)/marketplace',
    version: '1.0.0',
    status: 'stable',
  },
  {
    id: 'tribes',
    name: 'Tribes',
    icon: '🧬',
    route: '/(os)/tribes',
    version: '1.0.0',
    status: 'beta',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '💼',
    route: '/(os)/jobs',
    version: '1.0.0',
    status: 'coming_soon',
  },
];
