/**
 * ASIS Layer 4 — Data Deletion Engine
 * User-controlled data deletion with audit trail
 */

import { DataDeletionRequest, ContextScope } from '../types';
import { MemoryEngine } from './memory-engine';
import { PrivacyGate } from './privacy-gate';

export class DataDeletionEngine {
  private memoryEngine: MemoryEngine;
  private privacyGate: PrivacyGate;

  constructor(memoryEngine: MemoryEngine, privacyGate: PrivacyGate) {
    this.memoryEngine = memoryEngine;
    this.privacyGate = privacyGate;
  }

  async processDeletion(request: DataDeletionRequest): Promise<DataDeletionRequest> {
    request.status = 'processing';

    try {
      const scopes = request.scopes.map(s => s as ContextScope);
      let deleted = 0;

      switch (request.deleteType) {
        case 'soft':
          deleted = await this.softDelete(scopes);
          break;
        case 'hard':
          deleted = await this.hardDelete(scopes);
          break;
        case 'anonymize':
          deleted = await this.anonymize(scopes);
          break;
      }

      request.deletedCount = deleted;
      request.status = 'completed';
      request.completedAt = new Date();

    } catch (error) {
      request.status = 'failed';
      throw error;
    }

    return request;
  }

  private async softDelete(scopes: ContextScope[]): Promise<number> {
    // Mark as deleted but keep for audit
    return await this.memoryEngine.deleteByScope(scopes);
  }

  private async hardDelete(scopes: ContextScope[]): Promise<number> {
    // Permanently remove — requires additional confirmation
    const confirmed = await this.confirmHardDelete(scopes);
    if (!confirmed) {
      throw new Error('Hard delete not confirmed');
    }
    return await this.memoryEngine.deleteByScope(scopes);
  }

  private async anonymize(scopes: ContextScope[]): Promise<number> {
    // Replace PII with hashes, keep behavioral patterns
    // Implementation depends on memory structure
    return await this.memoryEngine.deleteByScope(scopes);
  }

  private async confirmHardDelete(scopes: ContextScope[]): Promise<boolean> {
    // This would trigger a UI confirmation flow
    // For now, require admin scope
    const allowed = await this.privacyGate.getAllowedScopes();
    return allowed.includes(ContextScope.ADMIN);
  }
}