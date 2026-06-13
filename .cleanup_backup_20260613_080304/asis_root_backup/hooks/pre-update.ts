// asis/deployment/hooks/pre-update.ts
// Pre-update safety checks

import { versionManager } from '../version-manager';

export async function preUpdate(fromVersion: string, toVersion: string): Promise<{
  ok: boolean;
  canRollback: boolean;
  migrationRequired: boolean;
}> {
  const canRollback = versionManager.canRollback();
  const migrationRequired = versionManager.parse(toVersion).major > versionManager.parse(fromVersion).major;

  // Verify backup exists
  const hasBackup = sessionStorage.getItem('asis_backup') !== null;

  return {
    ok: hasBackup || canRollback,
    canRollback,
    migrationRequired,
  };
}
