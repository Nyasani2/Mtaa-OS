// lib/mtaa/appstore/install-lifecycle.ts
import { createClient } from '@/lib/supabase/client';
import { unifiedRegistry, AppManifest } from './unified-registry';
import { appChunker } from '@/lib/mtaa/lazy-loading/app-chunker';

export interface InstallState { appId: string; status: 'pending'|'downloading'|'installing'|'installed'|'failed'; progress: number; error?: string; }

class InstallLifecycle {
  private supabase = createClient(); private states = new Map<string, InstallState>();

  async install(appId: string, userId: string): Promise<InstallState> {
    const manifest = unifiedRegistry.getApp(appId);
    if (!manifest) throw new Error(`App not found: ${appId}`);
    const state: InstallState = { appId, status: 'pending', progress: 0 };
    this.states.set(appId, state);
    try {
      state.status = 'downloading'; state.progress = 10;
      const chunk = appChunker.getChunk(appId);
      if (chunk) await appChunker.loadChunk(chunk.id);
      state.progress = 50; state.status = 'installing'; state.progress = 75;
      await this.supabase.from('app_installs').upsert({
        user_id: userId, app_id: appId, version: manifest.version,
        installed_at: new Date().toISOString(), status: 'active',
      });
      state.status = 'installed'; state.progress = 100;
    } catch (error) { state.status = 'failed'; state.error = error instanceof Error ? error.message : 'Install failed'; }
    this.states.set(appId, state); return state;
  }

  async uninstall(appId: string, userId: string): Promise<void> {
    await this.supabase.from('app_installs').update({ status: 'uninstalled', uninstalled_at: new Date().toISOString() }).eq('user_id', userId).eq('app_id', appId);
    this.states.delete(appId);
  }

  async update(appId: string, userId: string): Promise<InstallState> { await this.uninstall(appId, userId); return this.install(appId, userId); }
  getState(appId: string): InstallState|undefined { return this.states.get(appId); }
}
export const installLifecycle = new InstallLifecycle();
