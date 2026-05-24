import { IAuditLog } from './interfaces';
import { AuditEntry } from './types';

export class HealthAuditLog implements IAuditLog {
  private logs: Map<string, AuditEntry> = new Map();
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
    const full: AuditEntry = { ...entry, id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, timestamp: new Date().toISOString() };
    this.logs.set(full.id, full); return full;
  }
  async getLogs(userId: string, options?: { from?: string; to?: string; actorType?: string }): Promise<AuditEntry[]> {
    let r = Array.from(this.logs.values()).filter(l => l.userId === userId);
    if (options?.from) r = r.filter(l => l.timestamp >= options.from!);
    if (options?.to) r = r.filter(l => l.timestamp <= options.to!);
    if (options?.actorType) r = r.filter(l => l.actorType === options.actorType);
    return r.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  async getRecordAudit(recordId: string): Promise<AuditEntry[]> { return Array.from(this.logs.values()).filter(l => l.recordId === recordId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); }
  async getAllForUser(userId: string): Promise<AuditEntry[]> { return this.getLogs(userId); }
}
