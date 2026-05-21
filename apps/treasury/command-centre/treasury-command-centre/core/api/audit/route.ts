import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')
  const limit = parseInt(searchParams.get('limit') || '100')

  let q = supabase.from('treasury_audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (table) q = q.eq('table_name', table)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data })
}
