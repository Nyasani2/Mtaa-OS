// ASIS MTaxi Driver Onboarding Action Handler
// Add to: lib/asis/agents/tools/transport-tools.ts

import { router } from 'expo-router';

export interface MTaxiDriverAction {
  type: 'mtaxi-driver-onboarding' | 'mtaxi-driver-status' | 'mtaxi-driver-documents' | 'mtaxi-driver-inspection';
  step?: number;
  data?: Record<string, any>;
}

export function handleMTaxiDriverAction(action: MTaxiDriverAction): string {
  switch (action.type) {
    case 'mtaxi-driver-onboarding':
      // Route to the onboarding screen
      router.push('/(mtaxi)/driver/onboarding');
      return 'Opening MTaxi driver onboarding...';

    case 'mtaxi-driver-status':
      router.push('/(mtaxi)/driver/onboarding/status');
      return 'Checking your driver application status...';

    case 'mtaxi-driver-documents':
      router.push('/(mtaxi)/driver/onboarding/documents');
      return 'Opening document upload...';

    case 'mtaxi-driver-inspection':
      router.push('/(mtaxi)/driver/onboarding/inspection');
      return 'Opening inspection scheduling...';

    default:
      return 'Unknown driver action';
  }
}

// Intent classifier for MTaxi queries
export function classifyMTaxiIntent(query: string): 'rider' | 'driver' | 'unknown' {
  const driverKeywords = [
    'onboard', 'onboarding', 'register as driver', 'become a driver', 'drive for',
    'cab', 'taxi driver', 'psv', 'my car', 'my vehicle', 'my cab', 'my taxi',
    'upload documents', 'inspection', 'background check', 'driver application',
    'start driving', 'join as driver', 'driver sign up', 'how do i drive',
    'vehicle registration', 'driver license', 'driving job', 'earn money driving'
  ];

  const riderKeywords = [
    'book', 'ride', 'trip', 'fare', 'destination', 'pick me up', 'going to',
    'need a ride', 'how much to', 'price to', 'cost to', 'get a cab',
    'call taxi', 'request ride', 'nearby drivers'
  ];

  const lowerQuery = query.toLowerCase();

  const driverScore = driverKeywords.filter(k => lowerQuery.includes(k)).length;
  const riderScore = riderKeywords.filter(k => lowerQuery.includes(k)).length;

  if (driverScore > 0 && driverScore >= riderScore) return 'driver';
  if (riderScore > 0 && riderScore > driverScore) return 'rider';
  return 'unknown';
}
