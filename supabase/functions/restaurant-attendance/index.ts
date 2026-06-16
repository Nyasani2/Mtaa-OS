// supabase/functions/restaurant-attendance/index.ts
// MTAA Restaurant — Staff Attendance Edge Function
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'list'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'today': {
          const staff_id = url.searchParams.get('staff_id')
          const today = new Date().toISOString().split('T')[0]
          const { data, error } = await supabase
            .from('restaurant_attendance')
            .select('*')
            .eq('staff_id', staff_id)
            .gte('clock_in', today)
            .order('clock_in', { ascending: false })
            .limit(1)
            .single()
          if (error && error.code !== 'PGRST116') throw error
          result = data || null
          break
        }
        case 'list': {
          let query = supabase
            .from('restaurant_attendance')
            .select('*, staff:restaurant_staff(name, role)', { count: 'exact' })

          const staff_id = url.searchParams.get('staff_id')
          const date_from = url.searchParams.get('date_from')
          const date_to = url.searchParams.get('date_to')
          const status = url.searchParams.get('status')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          if (staff_id) query = query.eq('staff_id', staff_id)
          if (date_from) query = query.gte('clock_in', date_from)
          if (date_to) query = query.lte('clock_in', date_to)
          if (status) query = query.eq('status', status)

          const { data, error, count } = await query
            .order('clock_in', { ascending: false })
            .range(offset, offset + limit - 1)
          if (error) throw error
          result = { records: data || [], total: count || 0 }
          break
        }
        case 'weekly_hours': {
          const staff_id = url.searchParams.get('staff_id')
          const week_start = url.searchParams.get('week_start') || new Date().toISOString().split('T')[0]
          const weekEnd = new Date(week_start)
          weekEnd.setDate(weekEnd.getDate() + 7)

          const { data, error } = await supabase
            .from('restaurant_attendance')
            .select('clock_in, clock_out')
            .eq('staff_id', staff_id)
            .gte('clock_in', week_start)
            .lt('clock_in', weekEnd.toISOString())
          if (error) throw error

          let total_hours = 0
          let regular_hours = 0
          let overtime_hours = 0
          const days_worked = new Set()

          for (const record of data || []) {
            if (record.clock_out) {
              const start = new Date(record.clock_in)
              const end = new Date(record.clock_out)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              total_hours += hours
              days_worked.add(record.clock_in.split('T')[0])

              if (hours > 8) {
                regular_hours += 8
                overtime_hours += hours - 8
              } else {
                regular_hours += hours
              }
            }
          }

          result = {
            total_hours: Math.round(total_hours * 100) / 100,
            regular_hours: Math.round(regular_hours * 100) / 100,
            overtime_hours: Math.round(overtime_hours * 100) / 100,
            days_worked: days_worked.size,
          }
          break
        }
        case 'on_duty': {
          const today = new Date().toISOString().split('T')[0]
          const { data, error } = await supabase
            .from('restaurant_attendance')
            .select('*, staff:restaurant_staff(name, role, phone)')
            .gte('clock_in', today)
            .is('clock_out', null)
            .order('clock_in', { ascending: false })
          if (error) throw error
          result = data || []
          break
        }
        default:
          throw new Error(`Unknown GET action: ${action}`)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()

      switch (body.action) {
        case 'clock_in': {
          const { payload } = body
          const { data: staff, error: pinError } = await supabase
            .from('restaurant_staff')
            .select('id, name, role, pin_hash')
            .eq('id', payload.staff_id)
            .single()
          if (pinError || !staff) throw new Error('Invalid staff ID')

          if (!payload.pin || payload.pin.length !== 4) {
            throw new Error('Invalid PIN')
          }

          const { data, error } = await supabase
            .from('restaurant_attendance')
            .insert({
              staff_id: payload.staff_id,
              clock_in: new Date().toISOString(),
              location: payload.location,
              device_id: payload.device_id,
              status: 'present',
            })
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'clock_out': {
          const { payload } = body
          const { data: lastRecord } = await supabase
            .from('restaurant_attendance')
            .select('id, clock_in')
            .eq('staff_id', payload.staff_id)
            .is('clock_out', null)
            .order('clock_in', { ascending: false })
            .limit(1)
            .single()

          if (!lastRecord) throw new Error('No active clock-in found')

          const clockOut = new Date().toISOString()
          const hours = (new Date(clockOut).getTime() - new Date(lastRecord.clock_in).getTime()) / (1000 * 60 * 60)

          const { data, error } = await supabase
            .from('restaurant_attendance')
            .update({
              clock_out: clockOut,
              location_out: payload.location,
              hours_worked: Math.round(hours * 100) / 100,
              status: hours > 8 ? 'present' : hours > 4 ? 'present' : 'late',
            })
            .eq('id', lastRecord.id)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        default:
          throw new Error(`Unknown POST action: ${body.action}`)
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
