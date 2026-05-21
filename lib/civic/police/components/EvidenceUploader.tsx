import React, { useRef, useState } from 'react'
import { useEvidence } from '../hooks/useEvidence'

interface EvidenceUploaderProps {
  caseId: string
}

export function EvidenceUploader({ caseId }: EvidenceUploaderProps) {
  const { evidence, uploading, uploadFile, deleteFile, fetchEvidence } = useEvidence(caseId)
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'document' | 'audio') => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadFile(file, type, description)
      setDescription('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      alert('Failed to upload: ' + (err as Error).message)
    }
  }

  const handleDelete = async (evidenceId: string, path: string) => {
    if (!confirm('Delete this evidence?')) return
    try {
      await deleteFile(evidenceId, path)
    } catch (err) {
      alert('Failed to delete: ' + (err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Upload Evidence</h4>

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading...' : '📷 Photo'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            🎥 Video
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            📄 Document
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'photo')}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
        </div>
      </div>

      {evidence.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {evidence.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-3 relative group">
              {item.type === 'photo' && (
                <img src={item.url} alt="Evidence" className="w-full h-32 object-cover rounded-md" />
              )}
              {item.type === 'video' && (
                <video src={item.url} className="w-full h-32 object-cover rounded-md" controls />
              )}
              {(item.type === 'document' || item.type === 'audio') && (
                <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-3xl">{item.type === 'document' ? '📄' : '🎵'}</span>
                </div>
              )}

              <p className="text-xs text-gray-600 mt-2 truncate">{item.description || 'No description'}</p>
              <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>

              <button
                onClick={() => handleDelete(item.id, item.path)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
