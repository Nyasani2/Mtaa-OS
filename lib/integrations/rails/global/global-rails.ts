export const GLOBAL_RAILS = {
  stripe: {
    type: 'card',
    region: 'global',
  },
  ach: {
    type: 'bank',
    region: 'US',
  },
  sepa: {
    type: 'bank',
    region: 'EU',
  },
  swift: {
    type: 'bank',
    region: 'global',
  },
} as const;
