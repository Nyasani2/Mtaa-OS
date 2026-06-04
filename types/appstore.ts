// AppStore Type Definitions
// All types are also exported from useAppStore.ts for convenience

export interface Screenshot {
  id: string;
  uri: string;
  label: string;
  accent: string;
}

export interface AppItem {
  id: string;
  name: string;
  description: string;
  tagline: string;
  icon: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  installCount: string;
  size: string;
  version: string;
  developer: string;
  screenshots: Screenshot[];
  about: string;
  features: string[];
  permissions: string[];
  tags: string[];
  ranking?: { rank: number; category: string };
  sponsored?: boolean;
  route: string;
  isSystem?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  appCount: number;
}

export interface Interest {
  id: string;
  label: string;
  selected: boolean;
}

export interface Review {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  developerResponse?: string;
}

export type InstallStatus = 'downloading' | 'installing' | 'complete' | 'error';

export type AppCardVariant = 'compact' | 'full' | 'horizontal';
