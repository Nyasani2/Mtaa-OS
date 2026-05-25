// lib/kernel/index.ts
export { SearchEngine, getSearchEngine, resetSearchEngine } from './search-engine';
export { registerApp, getAppById, listApps, isSystemApp, isLocalApp } from './registry';
export { safeArray, safeObject, safeString, safeNumber, safeBoolean } from './safe-types';
export * from './registry/kernel-registry';
