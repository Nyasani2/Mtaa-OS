import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cycleId = searchParams.get('cycle_id')
  let q = supabase.from('treasury_budget_cycles').select('*').order('fiscal_year', { ascending: false })
  if (cycleId) q = q.eq('id', cycleId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cycles: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('treasury_budget_cycles').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cycle: data }, { status: 201 })
}
