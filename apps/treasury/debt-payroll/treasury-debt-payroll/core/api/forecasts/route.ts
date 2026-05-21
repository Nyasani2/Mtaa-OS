import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'cash'
  const table = type === 'revenue' ? 'treasury_revenue_forecasts' : 'treasury_cash_forecasts'
  const { data, error } = await supabase.from(table).select('*').order('forecast_period', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ forecasts: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type = body.type || 'cash'
  const table = type === 'revenue' ? 'treasury_revenue_forecasts' : 'treasury_cash_forecasts'
  const { data, error } = await supabase.from(table).insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ forecast: data }, { status: 201 })
}
