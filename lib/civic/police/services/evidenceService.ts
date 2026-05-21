import { supabase } from '../../shared/lib/supabase'

export const evidenceService = {
  async uploadEvidence(
    caseId: string,
    file: File,
    type: 'photo' | 'video' | 'document' | 'audio',
    description?: string
  ): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${caseId}/${type}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `police-evidence/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('civic-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('civic-documents')
      .getPublicUrl(filePath)

    // Save evidence record
    const { error: dbError } = await supabase
      .from('police_evidence')
      .insert({
        case_id: caseId,
        type,
        url: publicUrl,
        path: filePath,
        description,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    return { url: publicUrl, path: filePath }
  },

  async getEvidenceByCase(caseId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('police_evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async deleteEvidence(evidenceId: string, filePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from('civic-documents')
      .remove([filePath])

    if (storageError) throw storageError

    const { error: dbError } = await supabase
      .from('police_evidence')
      .delete()
      .eq('id', evidenceId)

    if (dbError) throw dbError
  },

  async getEvidenceUrl(path: string): Promise<string> {
    const { data: { publicUrl } } = supabase.storage
      .from('civic-documents')
      .getPublicUrl(path)
    return publicUrl
  }
}
