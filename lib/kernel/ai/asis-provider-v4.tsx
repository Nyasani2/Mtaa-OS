// @ts-nocheck
/**
 * ASIS CSE v2 — Legacy Provider Bridge
 * Replaces dead asis-provider-v6 import
 */

import React from 'react';
import { ASISCSEProvider, useASIS } from '@/lib/asis-cse/asis-cse-provider';

export { ASISCSEProvider as ASISProvider, useASIS };

export function AsisProviderV4({ children }: { children: React.ReactNode }) {
  return (
    <ASISCSEProvider  autoInitialize={true}>
      {children}
    </ASISCSEProvider>
  );
}
