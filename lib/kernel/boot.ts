import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase/client';

export interface BootResult {
  success: boolean;
  error?: string;
  phase: string;
}

const BOOT_PHASES = [
  'auth_init',
  'config_load',
  'registry_init',
  'stores_hydrate',
  'services_ready',
] as const;

export async function bootKernel(): Promise<BootResult> {
  try {
    // Phase 1: Auth init
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw new Error(`Auth init failed: ${authError.message}`);

    // Phase 2: Config load (feature flags, etc.)
    const { error: configError } = await supabase
      .from('feature_flags')
      .select('name, enabled')
      .eq('enabled', true);
    if (configError) console.warn('Config load warning:', configError.message);

    // Phase 3: Registry init
    // Registry is loaded lazily by each module

    // Phase 4: Store hydration
    // Zustand persist handles this automatically

    // Phase 5: Services ready
    // Services initialize on first use

    return { success: true, phase: 'complete' };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown boot error',
      phase: 'failed',
    };
  }
}

export function getBootPhases() {
  return BOOT_PHASES;
}
