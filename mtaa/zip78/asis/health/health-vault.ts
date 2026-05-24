import { IHealthVault } from './interfaces';
import { HealthRecord, HealthCategory } from './types';
import { HealthAuditLog } from './audit-log';

export class HealthVault implements IHealthVault {
  private store: Map<string, HealthRecord[]> = new Map();
  private audit: HealthAuditLog;

  constructor(auditLog: HealthAuditLog) { this.audit = auditLog; }

  async createRecord(userId: string, record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord> {
    const now = new Date().toISOString();
    const newRecord: HealthRecord = { ...record, id: `hr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, createdAt: now, updatedAt: now, isDeleted: false };
    const userRecords = this.store.get(userId) || [];
    userRecords.push(newRecord);
    this.store.set(userId, userRecords);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'RECORD_CREATED', recordId: newRecord.id, result: 'success', details: `Created ${record.category}: ${record.title}` });
    return newRecord;
  }

  async getRecords(userId: string, categories?: HealthCategory[]): Promise<HealthRecord[]> {
    const records = (this.store.get(userId) || []).filter(r => !r.isDeleted);
    return categories ? records.filter(r => categories.includes(r.category)) : records;
  }

  async updateRecord(userId: string, recordId: string, updates: Partial<HealthRecord>): Promise<HealthRecord> {
    const userRecords = this.store.get(userId) || [];
    const idx = userRecords.findIndex(r => r.id === recordId && !r.isDeleted);
    if (idx === -1) throw new Error('Record not found');
    const updated = { ...userRecords[idx], ...updates, updatedAt: new Date().toISOString() };
    userRecords[idx] = updated;
    this.store.set(userId, userRecords);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'RECORD_UPDATED', recordId, result: 'success', details: `Updated: ${updates.title || 'fields modified'}` });
    return updated;
  }

  async deleteRecord(userId: string, recordId: string): Promise<void> {
    const userRecords = this.store.get(userId) || [];
    const idx = userRecords.findIndex(r => r.id === recordId);
    if (idx === -1) throw new Error('Record not found');
    userRecords[idx] = { ...userRecords[idx], isDeleted: true, updatedAt: new Date().toISOString() };
    this.store.set(userId, userRecords);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'RECORD_DELETED', recordId, result: 'success', details: 'Record soft-deleted' });
  }

  async exportData(userId: string): Promise<string> {
    const records = await this.getRecords(userId);
    const payload = { exportedAt: new Date().toISOString(), userId, recordCount: records.length, records };
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'DATA_EXPORTED', result: 'success', details: `Exported ${records.length} records` });
    return JSON.stringify(payload, null, 2);
  }

  async purgeData(userId: string): Promise<void> {
    const count = (this.store.get(userId) || []).length;
    this.store.delete(userId);
    await this.audit.log({ userId, actorId: userId, actorType: 'user', action: 'DATA_PURGED', result: 'success', details: `Purged ${count} records` });
  }
}
