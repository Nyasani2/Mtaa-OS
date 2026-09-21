// lib/navigation/route-registry.ts
// Single Source of Truth for ASIS Navigation
// Maps ASIS intents to actual Expo Router file paths

export const MTAA_ROUTES: Record<string, string> = {
  // OS & Core
  'home': '/',
  'profile': '/(os)/profile',
  'settings': '/(os)/settings',
  
  // Finance
  'wallet': '/(os)/wallet',
  'wallet_transfer': '/(os)/wallet/transfer',
  'wallet_history': '/(os)/wallet/history',
  
  // Transport
  'mtaxi': '/(os)/mtaxi',
  'mtaxi_request': '/(os)/mtaxi', // Fixed: was /mtaxi/request which caused 404
  'mtruck': '/(os)/mtruck',
  'boda': '/(os)/boda',
  
  // Commerce & Stay
  'shop': '/(os)/shop',
  'marketplace': '/(os)/marketplace',
  'stay': '/(os)/stay',
  'stay_booking': '/(os)/stay',
  
  // Health & Education
  'health': '/(os)/health',
  'health_appointment': '/(os)/health',
  'education': '/(os)/education',
  
  // Fallback
  'default': '/',
};

export function resolveRoute(intent: string): string {
  return MTAA_ROUTES[intent] || MTAA_ROUTES['default'];
}
