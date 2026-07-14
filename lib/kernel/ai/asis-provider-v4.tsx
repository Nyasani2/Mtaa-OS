import React from 'react';
import { ASISProvider } from './asis-provider-v6';

/**
 * Compatibility wrapper: AsisProviderV4 -> ASISProvider v6
 * Allows app/_layout.tsx to import without changes.
 */
export const AsisProviderV4 = ASISProvider;
export { useASIS } from './asis-provider-v6';
