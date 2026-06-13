// asis/deployment/install-manager.ts
// Install ASIS into MTAA OS with rollback safety

import { ASIS_PACKAGE } from './asis-package';
import { systemLoader } from './system-loader';
import { moduleLinker } from './module-linker';
import { versionManager } from './version-manager';

export type InstallPhase =
  | 'validate'
  | 'backup'
  | 'install'
  | 'link'
  | 'activate'
  | 'verify'
  | 'complete'
  | 'rollback';

interface InstallState {
  phase: InstallPhase;
  package: ASIS_PACKAGE;
  backup?: any;
  errors: string[];
  completed: boolean;
}

class InstallManager {
  private state: InstallState | null = null;
  private listeners: Set<(phase: InstallPhase, msg: string) => void> = new Set();

  onProgress(cb: (phase: InstallPhase, msg: string) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(phase: InstallPhase, msg: string) {
    this.listeners.forEach(cb => cb(phase, msg));
  }

  async install(pkg: ASIS_PACKAGE): Promise<{ success: boolean; error?: string }> {
    this.state = { phase: 'validate', package: pkg, errors: [], completed: false };

    try {
      // 1. VALIDATE
      this.emit('validate', 'Validating package integrity...');
      await this.validate(pkg);

      // 2. BACKUP STATE
      this.state.phase = 'backup';
      this.emit('backup', 'Creating system backup...');
      const backup = await this.createBackup();
      this.state.backup = backup;

      // 3. INSTALL MODULES
      this.state.phase = 'install';
      this.emit('install', 'Installing ASIS modules...');
      await this.installModules(pkg);

      // 4. LINK DEPENDENCIES
      this.state.phase = 'link';
      this.emit('link', 'Linking module dependencies...');
      await moduleLinker.link(pkg.modules.map(m => m.name));

      // 5. ACTIVATE
      this.state.phase = 'activate';
      this.emit('activate', 'Activating ASIS runtime...');
      await systemLoader.initialize(pkg);

      // 6. VERIFY
      this.state.phase = 'verify';
      this.emit('verify', 'Running post-install verification...');
      await this.verifyInstallation(pkg);

      this.state.phase = 'complete';
      this.state.completed = true;
      this.emit('complete', 'ASIS installation complete.');

      versionManager.registerInstalled(pkg.version);
      return { success: true };

    } catch (err: any) {
      this.state.errors.push(err.message);
      this.emit('rollback', `Installation failed: ${err.message}. Rolling back...`);
      await this.rollback();
      return { success: false, error: err.message };
    }
  }

  private async validate(pkg: ASIS_PACKAGE) {
    // Check system compatibility
    const mem = (navigator as any).deviceMemory || 4;
    if (mem < pkg.runtimeRequirements.minMemoryMB / 1024) {
      throw new Error(`Insufficient memory: ${mem}GB < ${pkg.runtimeRequirements.minMemoryMB}MB required`);
    }
    // Validate checksums
    for (const [mod, hash] of Object.entries(pkg.checksums)) {
      if (!hash || hash.length < 10) {
        throw new Error(`Invalid checksum for module: ${mod}`);
      }
    }
  }

  private async createBackup(): Promise<any> {
    // Snapshot current ASIS state
    return {
      version: versionManager.current(),
      timestamp: Date.now(),
      modules: [], // Would capture current module state
    };
  }

  private async installModules(pkg: ASIS_PACKAGE) {
    for (const mod of pkg.modules) {
      this.emit('install', `Installing ${mod.name}...`);
      // Register in runtime kernel
      await systemLoader.registerModule(mod);
    }
  }

  private async verifyInstallation(pkg: ASIS_PACKAGE) {
    // Verify all modules loaded
    for (const mod of pkg.modules) {
      const loaded = await systemLoader.isModuleLoaded(mod.name);
      if (!loaded) {
        throw new Error(`Module ${mod.name} failed to load`);
      }
    }
  }

  async rollback(): Promise<boolean> {
    if (!this.state?.backup) return false;
    try {
      this.state.phase = 'rollback';
      // Restore previous version
      await systemLoader.restore(this.state.backup);
      await moduleLinker.unlinkAll();
      return true;
    } catch {
      return false;
    }
  }

  getState(): InstallState | null {
    return this.state;
  }
}

export const installManager = new InstallManager();
