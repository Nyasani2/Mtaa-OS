// ASIS v1 - Prompts Barrel Export
// Central registry for all domain-specific system prompts

export { default as walletPrompt } from './wallet.prompt';
export { default as transportPrompt } from './transport.prompt';
export { default as healthPrompt } from './health.prompt';
export { default as jobsPrompt } from './jobs.prompt';
export { default as civicPrompt } from './civic.prompt';
export { default as streetsPrompt } from './streets.prompt';
export { default as marketplacePrompt } from './marketplace.prompt';
export { default as educationPrompt } from './education.prompt';
export { default as tribesPrompt } from './tribes.prompt';
export { default as appstorePrompt } from './appstore.prompt';

export const domainPrompts = {
  wallet: 'wallet.prompt',
  transport: 'transport.prompt',
  health: 'health.prompt',
  jobs: 'jobs.prompt',
  civic: 'civic.prompt',
  streets: 'streets.prompt',
  marketplace: 'marketplace.prompt',
  education: 'education.prompt',
  tribes: 'tribes.prompt',
  appstore: 'appstore.prompt',
  general: 'general', // Uses base prompt only
} as const;

export type DomainPromptKey = keyof typeof domainPrompts;

export function getPromptForDomain(domain: string): string | null {
  return domainPrompts[domain as DomainPromptKey] || null;
}

export default domainPrompts;
