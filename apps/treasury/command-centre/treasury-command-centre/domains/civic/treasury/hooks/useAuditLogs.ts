'use client'
import { useEffect, useState } from 'react'
import { AuditLog } from '../types/command.types'
import { fetchAuditLogs } from '../services/auditService'

export function useAuditLogs(tableName?: string) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs(tableName).then(setLogs).finally(() => setLoading(false))
  }, [tableName])

  return { logs, loading }
}
