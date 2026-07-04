import { bootKernel } from './boot';

let initialized = false;

export async function initOS(): Promise<void> {
  if (initialized) return;

  const result = await bootKernel();
  if (!result.success) {
    console.error('OS Boot failed:', result.error);
    // Don't throw — let the app show error UI
  }

  initialized = true;
}

export function isInitialized(): boolean {
  return initialized;
}
