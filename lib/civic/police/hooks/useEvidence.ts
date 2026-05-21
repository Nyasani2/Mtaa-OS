import { useState, useCallback } from 'react'
import { evidenceService } from '../services/evidenceService'

export function useEvidence(caseId: string) {
  const [evidence, setEvidence] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvidence = useCallback(async () => {
    try {
      setError(null)
      const data = await evidenceService.getEvidenceByCase(caseId)
      setEvidence(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch evidence')
    }
  }, [caseId])

  const uploadFile = async (file: File, type: 'photo' | 'video' | 'document' | 'audio', description?: string) => {
    try {
      setUploading(true)
      setError(null)
      const result = await evidenceService.uploadEvidence(caseId, file, type, description)
      await fetchEvidence()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to upload evidence')
      throw err
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (evidenceId: string, filePath: string) => {
    try {
      await evidenceService.deleteEvidence(evidenceId, filePath)
      setEvidence(prev => prev.filter(e => e.id !== evidenceId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete evidence')
      throw err
    }
  }

  return {
    evidence,
    uploading,
    error,
    fetchEvidence,
    uploadFile,
    deleteFile
  }
}
