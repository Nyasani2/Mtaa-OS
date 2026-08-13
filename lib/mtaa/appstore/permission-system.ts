// lib/mtaa/appstore/permission-system.ts
export type Permission = 'camera'|'microphone'|'location'|'contacts'|'notifications'|'storage'|'bluetooth';

export interface PermissionGrant { appId: string; permission: Permission; granted: boolean; grantedAt: string|null; }

class PermissionSystem {
  private grants = new Map<string, PermissionGrant[]>();

  async requestPermission(appId: string, permission: Permission): Promise<boolean> {
    const grant: PermissionGrant = { appId, permission, granted: true, grantedAt: new Date().toISOString() };
    const appGrants = this.grants.get(appId) || [];
    const existing = appGrants.find((g: any) => g.permission === permission);
    if (existing) { existing.granted = true; existing.grantedAt = grant.grantedAt; } else { appGrants.push(grant); }
    this.grants.set(appId, appGrants); return true;
  }

  hasPermission(appId: string, permission: Permission): boolean {
    return (this.grants.get(appId) || []).some((g: any) => g.permission === permission && g.granted);
  }

  getAppPermissions(appId: string): PermissionGrant[] { return this.grants.get(appId) || []; }
  revokePermission(appId: string, permission: Permission): void {
    const grant = (this.grants.get(appId) || []).find((g: any) => g.permission === permission);
    if (grant) grant.granted = false;
  }
  revokeAll(appId: string): void { this.grants.delete(appId); }
}
export const permissionSystem = new PermissionSystem();
