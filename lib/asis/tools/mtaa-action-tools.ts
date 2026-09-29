// @ts-nocheck
/**
 * MTAA Action Tools
 * Allows ASIS to trigger specific app actions (MTaxi, Marketplace, etc.)
 */
import { OS_APP_REGISTRY } from '@/lib/os/app-registry';
import { APP_REGISTRY } from '@/lib/mtaa/appstore/registry';

export interface ActionToolResult {
  success: boolean;
  actionType: string;
  route?: string;
  payload?: any;
  message: string;
}

export function requestMTaxi(destination: string): ActionToolResult {
  const taxiApp = OS_APP_REGISTRY['mtaxi'] || APP_REGISTRY['mtaxi'];
  if (!taxiApp) {
    return { success: false, actionType: 'mtaxi_request', message: 'MTaxi module not found.' };
  }
  return {
    success: true,
    actionType: 'mtaxi_request',
    route: taxiApp.route,
    payload: { destination, autoFill: true },
    message: `Opening MTaxi to book a ride to ${destination}.`,
  };
}

export function searchMarketplace(query: string): ActionToolResult {
  const shopApp = OS_APP_REGISTRY['marketplace'] || APP_REGISTRY['marketplace'];
  if (!shopApp) {
    return { success: false, actionType: 'marketplace_search', message: 'Marketplace module not found.' };
  }
  return {
    success: true,
    actionType: 'marketplace_search',
    route: shopApp.route,
    payload: { searchQuery: query },
    message: `Searching the Marketplace for "${query}".`,
  };
}

export function openApp(appName: string): ActionToolResult {
  const searchName = appName.toLowerCase();
  const osApp = Object.values(OS_APP_REGISTRY).find((a: any) => a.name.toLowerCase().includes(searchName));
  if (osApp) {
    return { success: true, actionType: 'app_launch', route: osApp.route, message: `Opening ${osApp.name}.` };
  }
  const storeApp = Object.values(APP_REGISTRY).find((a: any) => a.name.toLowerCase().includes(searchName));
  if (storeApp) {
    return { success: true, actionType: 'app_launch', route: storeApp.route, message: `Opening ${storeApp.name}.` };
  }
  return { success: false, actionType: 'app_launch', message: `I couldn't find an app named ${appName}.` };
}
