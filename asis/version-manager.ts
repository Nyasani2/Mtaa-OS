// asis/deployment/version-manager.ts
// Semantic versioning, migrations, compatibility

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  full: string;
}

export interface Migration {
  from: string;
  to: string;
  run: () => Promise<void>;
}

interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
}

class VersionManager {
  private currentVersion = '1.0.0';
  private installedVersions: string[] = [];
  private migrations: Migration[] = [];

  current(): string {
    return this.currentVersion;
  }

  parse(version: string): VersionInfo {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major, minor, patch, full: version };
  }

  compare(a: string, b: string): number {
    const va = this.parse(a);
    const vb = this.parse(b);
    if (va.major !== vb.major) return va.major - vb.major;
    if (va.minor !== vb.minor) return va.minor - vb.minor;
    return va.patch - vb.patch;
  }

  async checkCompatibility(module: string, targetVersion: string): Promise<CompatibilityResult> {
    const modVersion = this.getModuleVersion(module);
    if (!modVersion) return { compatible: true };

    const diff = this.compare(targetVersion, modVersion);
    if (diff < 0) {
      return { compatible: false, reason: `Target ${targetVersion} older than module ${modVersion}` };
    }
    if (diff > 0 && this.parse(targetVersion).major > this.parse(modVersion).major) {
      // Major version bump — check migration exists
      const hasMigration = this.migrations.some(m => m.from === modVersion && m.to === targetVersion);
      if (!hasMigration) {
        return { compatible: false, reason: `No migration path from ${modVersion} to ${targetVersion}` };
      }
    }
    return { compatible: true };
  }

  private getModuleVersion(module: string): string | null {
    // Would read from module manifest
    const versions: Record<string, string> = {
      'memory-core': '1.0.0',
      'runtime-kernel': '1.0.0',
      'agent-system': '1.0.0',
    };
    return versions[module] || null;
  }

  async migrate(from: string, to: string): Promise<boolean> {
    const migration = this.migrations.find(m => m.from === from && m.to === to);
    if (!migration) return false;
    await migration.run();
    return true;
  }

  registerMigration(migration: Migration) {
    this.migrations.push(migration);
  }

  registerInstalled(version: string) {
    this.installedVersions.push(version);
  }

  canRollback(): boolean {
    return this.installedVersions.length > 1;
  }

  async rollback(): Promise<string | null> {
    if (!this.canRollback()) return null;
    this.installedVersions.pop();
    return this.installedVersions[this.installedVersions.length - 1] || null;
  }
}

export const versionManager = new VersionManager();
