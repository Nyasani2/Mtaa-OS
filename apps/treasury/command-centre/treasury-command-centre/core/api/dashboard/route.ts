import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '30d'

  const { data: metrics, error } = await supabase.rpc('get_treasury_dashboard_metrics', { p_period: period })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ metrics })
}
