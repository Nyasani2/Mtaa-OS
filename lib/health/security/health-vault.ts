import { Platform } from 'react-native';
import { healthCrypto, EncryptedData } from './health-crypto';

// Lazy-load SecureStore to prevent web crash on module import
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // Web or missing module
}

export type HealthRecordType = 'visit' | 'prescription' | 'lab' | 'imaging' | 'vaccination' | 'note' | 'allergy';

export interface HealthRecord {
  id: string;
  type: HealthRecordType;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  title: string;
  data: any;
  signature?: string;
  checksum: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultStats {
  totalRecords: number;
  byType: Record<HealthRecordType, number>;
  totalSizeBytes: number;
  lastSyncAt: string | null;
}

export interface RecordFilter {
  type?: HealthRecordType;
  hospitalId?: string;
  doctorId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

const VAULT_PREFIX = 'health_vault_';
const VAULT_INDEX_KEY = 'health_vault_index';
const VAULT_STATS_KEY = 'health_vault_stats';

interface VaultIndex {
  recordIds: string[];
  metadata: Record<string, Omit<HealthRecord, 'data'>>;
}

let _vaultKey: CryptoKey | null = null;
let _index: VaultIndex = { recordIds: [], metadata: {} };

// Unified storage
const webStore = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch (e: any) { console.error("[HealthVault] Storage read failed:", e?.message || e); return null; }
    }
    if (SecureStore?.getItemAsync) {
      try { return await SecureStore.getItemAsync(key); } catch (e: any) { console.error("[HealthVault] Storage read failed:", e?.message || e); return null; }
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
<<<<<<< HEAD
      try { localStorage.setItem(key, value); } catch (e: any) { console.error("[HealthVault] Storage write failed:", e?.message || e); }
      return;
    }
    if (SecureStore?.setItemAsync) {
      try { await SecureStore.setItemAsync(key, value); } catch (e: any) { console.error("[HealthVault] Storage write failed:", e?.message || e); }
=======
      try { localStorage.setItem(key, value); } catch (e) { console.error('[health-vault] localStorage.setItem failed:', e); }
      return;
    }
    if (SecureStore?.setItemAsync) {
      try { await SecureStore.setItemAsync(key, value); } catch (e) { console.error('[health-vault] SecureStore.setItemAsync failed:', e); }
>>>>>>> origin/claude/consolidation-audit
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
<<<<<<< HEAD
      try { localStorage.removeItem(key); } catch (e: any) { console.error("[HealthVault] Storage write failed:", e?.message || e); }
      return;
    }
    if (SecureStore?.deleteItemAsync) {
      try { await SecureStore.deleteItemAsync(key); } catch (e: any) { console.error("[HealthVault] Storage write failed:", e?.message || e); }
=======
      try { localStorage.removeItem(key); } catch (e) { console.error('[health-vault] localStorage.removeItem failed:', e); }
      return;
    }
    if (SecureStore?.deleteItemAsync) {
      try { await SecureStore.deleteItemAsync(key); } catch (e) { console.error('[health-vault] SecureStore.deleteItemAsync failed:', e); }
>>>>>>> origin/claude/consolidation-audit
    }
  },
};

async function loadIndex(): Promise<VaultIndex> {
  try {
    const raw = await webStore.getItem(VAULT_INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e: any) { console.error("[HealthVault] Operation failed:", e?.message || e); }
  return { recordIds: [], metadata: {} };
}

async function saveIndex(): Promise<void> {
  await webStore.setItem(VAULT_INDEX_KEY, JSON.stringify(_index));
}

export async function initializeVault(masterKey: CryptoKey): Promise<void> {
  _vaultKey = masterKey;
  _index = await loadIndex();
}

export async function isVaultInitialized(): Promise<boolean> {
  return !!_vaultKey;
}

export async function storeRecord(record: HealthRecord): Promise<void> {
  if (!_vaultKey) throw new Error('Vault not initialized');
  const checksum = await healthCrypto.generateChecksum(record.data);
  record.checksum = checksum;
  record.updatedAt = new Date().toISOString();
  const encrypted = await healthCrypto.encrypt(record.data, _vaultKey);
  await webStore.setItem(VAULT_PREFIX + record.id, JSON.stringify(encrypted));
  _index.recordIds = _index.recordIds.filter(id => id !== record.id);
  _index.recordIds.unshift(record.id);
  const { data, ...meta } = record;
  _index.metadata[record.id] = meta;
  await saveIndex();
}

export async function getRecord(recordId: string): Promise<HealthRecord | null> {
  if (!_vaultKey) throw new Error('Vault not initialized');
  const meta = _index.metadata[recordId];
  if (!meta) return null;
  const raw = await webStore.getItem(VAULT_PREFIX + recordId);
  if (!raw) return null;
  try {
    const encrypted: EncryptedData = JSON.parse(raw);
    const data = await healthCrypto.decrypt(encrypted, _vaultKey);
    const record: HealthRecord = { ...meta, data };
    const valid = await healthCrypto.verifyChecksum(data, meta.checksum);
    if (!valid) console.warn(`Checksum mismatch for record ${recordId}`);
    return record;
  } catch {
    return null;
  }
}

export async function listRecords(filter?: RecordFilter): Promise<HealthRecord[]> {
  const records: HealthRecord[] = [];
  for (const id of _index.recordIds) {
    const meta = _index.metadata[id];
    if (!meta) continue;
    if (filter?.type && meta.type !== filter.type) continue;
    if (filter?.hospitalId && meta.hospitalId !== filter.hospitalId) continue;
    if (filter?.doctorId && meta.doctorId !== filter.doctorId) continue;
    if (filter?.fromDate && meta.date < filter.fromDate) continue;
    if (filter?.toDate && meta.date > filter.toDate) continue;
    if (filter?.search) {
      const hay = `${meta.title} ${meta.hospitalName} ${meta.doctorName}`.toLowerCase();
      if (!hay.includes(filter.search.toLowerCase())) continue;
    }
    records.push({ ...meta, data: null } as HealthRecord);
  }
  return records;
}

export async function deleteRecord(recordId: string): Promise<void> {
  await webStore.deleteItem(VAULT_PREFIX + recordId);
  _index.recordIds = _index.recordIds.filter(id => id !== recordId);
  delete _index.metadata[recordId];
  await saveIndex();
}

export async function getVaultStats(): Promise<VaultStats> {
  const byType: Record<string, number> = {};
  let totalSize = 0;
  for (const id of _index.recordIds) {
    const meta = _index.metadata[id];
    if (!meta) continue;
    byType[meta.type] = (byType[meta.type] || 0) + 1;
    const raw = await webStore.getItem(VAULT_PREFIX + id);
    if (raw) totalSize += raw.length * 2;
  }
  return {
    totalRecords: _index.recordIds.length,
    byType: byType as Record<HealthRecordType, number>,
    totalSizeBytes: totalSize,
    lastSyncAt: null,
  };
}

export async function exportVault(): Promise<string> {
  if (!_vaultKey) throw new Error('Vault not initialized');
  const exportData: Record<string, any> = { index: _index, records: {} };
  for (const id of _index.recordIds) {
    const raw = await webStore.getItem(VAULT_PREFIX + id);
    if (raw) exportData.records[id] = raw;
  }
  return btoa(JSON.stringify(exportData));
}

export async function importVault(encryptedData: string): Promise<void> {
  const data = JSON.parse(atob(encryptedData));
  _index = data.index;
  for (const [id, raw] of Object.entries(data.records)) {
    await webStore.setItem(VAULT_PREFIX + id, raw as string);
  }
  await saveIndex();
}

export async function clearVault(): Promise<void> {
  for (const id of _index.recordIds) {
    await webStore.deleteItem(VAULT_PREFIX + id);
  }
  await webStore.deleteItem(VAULT_INDEX_KEY);
  await webStore.deleteItem(VAULT_STATS_KEY);
  _index = { recordIds: [], metadata: {} };
}
