// asis/deployment/hooks/rollback.ts
// Rollback to previous version on failure

import { versionManager } from '../version-manager';
import { systemLoader } from '../system-loader';

export async function executeRollback(): Promise<{ success: boolean; restoredVersion: string | null }> {
  const previous = await versionManager.rollback();
  if (!previous) {
    return { success: false, restoredVersion: null };
  }

  // Restore system state
  const backup = JSON.parse(sessionStorage.getItem('asis_backup') || '{}');
  await systemLoader.restore(backup);

  return { success: true, restoredVersion: previous };
}
