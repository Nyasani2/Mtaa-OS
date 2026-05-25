// lib/mtaa/appstore/store-feed.ts
import { AppManifest } from '@/types/module.types';

export function getStoreFeed(): AppManifest[] {
  // In production: fetch from Supabase edge function
  return [];
}

export function getStoreCategories(): string[] {
  return Array.from(new Set(getStoreFeed().map((app) => app.category)));
}
