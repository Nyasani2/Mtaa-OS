// asis/deployment/hooks/post-install.ts
// Post-installation verification and cleanup

export async function postInstall(): Promise<{ ok: boolean; cleanup: string[] }> {
  const cleanup: string[] = [];

  // Verify all core modules registered
  const loader = (globalThis as any).__ASIS_SYSTEM_LOADER__;
  const status = loader?.getStatus?.();
  if (!status?.initialized) {
    return { ok: false, cleanup };
  }

  // Clean temp files
  cleanup.push('temp_downloads');
  cleanup.push('install_cache');

  // Verify API gateway
  const gateway = (globalThis as any).__ASIS_API_GATEWAY__;
  if (!gateway?.active) {
    return { ok: false, cleanup };
  }

  return { ok: true, cleanup };
}
