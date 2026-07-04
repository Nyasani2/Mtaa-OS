// lib/hooks/useOSKernel.ts
// FIXED v2: bannerImage is now in AppItem type (via AppManifest inheritance)

import { useState, useCallback } from 'react';
import { AppItem } from '@/lib/mtaa/appstore/apps/types';

const DEFAULT_APPS: AppItem[] = [
  { id: 'wallet', name: 'Wallet', description: 'Manage your finances', version: '1.0.0', icon: 'wallet', category: 'finance', bannerImage: undefined, color: '#10b981' },
  { id: 'streets', name: 'Streets', description: 'Social feed', version: '1.0.0', icon: 'home', category: 'social', bannerImage: undefined, color: '#3b82f6' },
  { id: 'health', name: 'Health', description: 'Health services', version: '1.0.0', icon: 'heart', category: 'health', bannerImage: undefined, color: '#ef4444' },
  { id: 'education', name: 'Education', description: 'Learning platform', version: '1.0.0', icon: 'book', category: 'education', bannerImage: undefined, color: '#8b5cf6' },
  { id: 'marketplace', name: 'Marketplace', description: 'Buy and sell', version: '1.0.0', icon: 'cart', category: 'commerce', bannerImage: undefined, color: '#f59e0b' },
  { id: 'tribes', name: 'Tribes', description: 'Communities', version: '1.0.0', icon: 'people', category: 'social', bannerImage: undefined, color: '#ec4899' },
  { id: 'civic', name: 'Civic', description: 'Government services', version: '1.0.0', icon: 'shield', category: 'civic', bannerImage: undefined, color: '#2563eb' },
  { id: 'messenger', name: 'Messenger', description: 'Messages', version: '1.0.0', icon: 'chat', category: 'communication', bannerImage: undefined, color: '#10b981' },
];

export function useOSKernel() {
  const [apps] = useState<AppItem[]>(DEFAULT_APPS);
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const launchApp = useCallback((appId: string) => {
    setActiveApp(appId);
  }, []);

  return { apps, activeApp, launchApp };
}
