
export type AppPackage = {
  id: string;
  name: string;
  icon: string;
  version: string;
  entry: string;
  status: 'installed' | 'disabled' | 'updating';
};

export const INSTALLED_APPS: AppPackage[] = [
  {
    id: 'feed',
    name: 'Feed',
    icon: '📰',
    version: '1.0.0',
    entry: '/(os)/feed',
    status: 'installed',
  },
  {
    id: 'auth',
    name: 'Auth',
    icon: '🔐',
    version: '1.0.0',
    entry: '/(os)/auth',
    status: 'installed',
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: '💰',
    version: '1.0.0',
    entry: '/(os)/wallet',
    status: 'installed',
  },
  {
    id: 'mtruck',
    name: 'MTruck',
    icon: '🚚',
    version: '1.0.0',
    entry: '/(os)/mtruck',
    status: 'installed',
  },
];

