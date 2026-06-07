export interface AppStoreApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  screenshots: string[];
  rating: number;
  version: string;
  size: string;
  developer: string;
  installed: boolean;
}

export interface AppItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  screenshots: string[];
  rating: number;
  version: string;
  size: string;
  developer: string;
  installed: boolean;
}

export type AppCategory = 'productivity' | 'finance' | 'transport' | 'social' | 'health' | 'education' | 'government';
