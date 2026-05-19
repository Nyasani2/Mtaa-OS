export type OSApp = {
  id: string;
  name: string;
  icon: string;
  route: string;
  status: 'active' | 'disabled';
};

export const OS_APPS: OSApp[] = [
  {
    id: 'feed',
    name: 'Feed',
    icon: '📰',
    route: '/(os)/feed',
    status: 'active',
  },
  {
    id: 'auth',
    name: 'Auth',
    icon: '🔐',
    route: '/(os)/auth',
    status: 'active',
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: '💰',
    route: '/(os)/wallet',
    status: 'active',
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: '📁',
    route: '/(os)/documents',
    status: 'active',
  },
  {
    id: 'mtaxi',
    name: 'MTaxi',
    icon: '🚕',
    route: '/(os)/mtaxi',
    status: 'active',
  },
  {
    id: 'mtruck',
    name: 'MTruck',
    icon: '🚚',
    route: '/(os)/mtruck',
    status: 'active',
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🛍️',
    route: '/(os)/shop',
    status: 'active',
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: '🏪',
    route: '/(os)/marketplace',
    status: 'active',
  },
  {
    id: 'tribes',
    name: 'Tribes',
    icon: '👥',
    route: '/(os)/tribes',
    status: 'active',
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: '💼',
    route: '/(os)/jobs',
    status: 'active',
  },
];
