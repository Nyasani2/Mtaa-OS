import { supabase } from '@/lib/supabase';
import { EvidenceItem } from '../types/police.types';

export interface EvidenceUpload {
  caseId: string;
  file: File;
  type: 'photo' | 'video' | 'document' | 'audio';
  description: string;
  collectedBy: string;
}

export class EvidenceService {
  async getEvidenceByCase(caseId: string) {
    const { data, error } = await supabase.from('case_evidence').select('*').eq('case_id', caseId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as EvidenceItem[];
  }

  async getEvidenceById(id: string) {
    const { data, error } = await supabase.from('case_evidence').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as EvidenceItem;
  }

  async createEvidence(evidence: Omit<EvidenceItem, 'id' | 'created_at'>) {
    const { data, error } = await supabase.from('case_evidence').insert(evidence).select().maybeSingle();
    if (error) throw error;
    return data as EvidenceItem;
  }

  async updateEvidence(id: string, updates: Partial<EvidenceItem>) {
    const { data, error } = await supabase.from('case_evidence').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data as EvidenceItem;
  }

  async deleteEvidence(id: string, filePath?: string) {
    const { error } = await supabase.from('case_evidence').delete().eq('id', id);
    if (error) throw error;
    if (filePath) {
      await supabase.storage.from('evidence').remove([filePath]);
    }
  }

  async uploadEvidenceFile(caseId: string, file: File, metadata: { type: 'photo' | 'video' | 'document' | 'audio'; description: string; collectedBy: string }) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${caseId}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('evidence').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName);
    const { data, error } = await supabase.from('case_evidence').insert({
      case_id: caseId, type: metadata.type, description: metadata.description, url: publicUrl,
      uploaded_by: metadata.collectedBy, created_at: new Date().toISOString(),
    }).select().maybeSingle();
    if (error) throw error;
    return data as EvidenceItem;
  }

  // Hook passes: caseId, file, type, description (optional)
  async uploadEvidence(caseId: string, file: File, type: 'photo' | 'video' | 'document' | 'audio', description?: string): Promise<EvidenceItem> {
    return this.uploadEvidenceFile(caseId, file, { type, description: description || '', collectedBy: 'system' });
  }

  async getEvidenceStats(caseId: string) {
    const { data, error } = await supabase.from('case_evidence').select('type', { count: 'exact' }).eq('case_id', caseId);
    if (error) throw error;
    const stats: Record<string, number> = {};
    data?.forEach((row: any) => { stats[row.type] = (stats[row.type] || 0) + 1; });
    return stats;
  }

  async chainOfCustody(evidenceId: string) {
    const { data, error } = await supabase.from('evidence_custody').select('*').eq('evidence_id', evidenceId).order('transferred_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  async transferCustody(evidenceId: string, fromOfficer: string, toOfficer: string, reason: string) {
    const { data, error } = await supabase.from('evidence_custody').insert({
      evidence_id: evidenceId, from_officer: fromOfficer, to_officer: toOfficer,
      transfer_reason: reason, transferred_at: new Date().toISOString(),
    }).select().maybeSingle();
    if (error) throw error;
    return data;
  }
}

export const evidenceService = new EvidenceService();
