// supabase/functions/restaurant-tables/index.ts
// MTAA Restaurant — Table & Reservation Management Edge Function
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const action = url.searchParams.get('action') || 'tables'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'tables': {
          let query = supabase
            .from('restaurant_tables')
            .select('*', { count: 'exact' })

          const status = url.searchParams.get('status')
          const section = url.searchParams.get('section')
          const capacity = url.searchParams.get('capacity')

          if (status) query = query.eq('status', status)
          if (section) query = query.eq('section', section)
          if (capacity) query = query.gte('capacity', parseInt(capacity))

          const { data, error, count } = await query.order('table_number')
          if (error) throw error
          result = { tables: data || [], total: count || 0 }
          break
        }
        case 'reservations': {
          let query = supabase
            .from('restaurant_reservations')
            .select('*, table:restaurant_tables(table_number, section)', { count: 'exact' })

          const date = url.searchParams.get('date')
          const table_id = url.searchParams.get('table_id')
          const status = url.searchParams.get('status')
          const limit = parseInt(url.searchParams.get('limit') || '50')

          if (date) {
            const dateStart = `${date}T00:00:00`
            const dateEnd = `${date}T23:59:59`
            query = query.gte('reservation_time', dateStart).lte('reservation_time', dateEnd)
          }
          if (table_id) query = query.eq('table_id', table_id)
          if (status) query = query.eq('status', status)

          const { data, error, count } = await query
            .order('reservation_time')
            .limit(limit)
          if (error) throw error
          result = { reservations: data || [], total: count || 0 }
          break
        }
        case 'floor_plan': {
          const { data: sections, error: sErr } = await supabase
            .from('restaurant_table_sections')
            .select('*')
            .order('name')
          if (sErr) throw sErr

          const { data: tables, error: tErr } = await supabase
            .from('restaurant_tables')
            .select('*')
            .order('table_number')
          if (tErr) throw tErr

          result = {
            sections: sections || [],
            tables: tables || [],
          }
          break
        }
        default:
          throw new Error(`Unknown GET action: ${action}`)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()

      switch (body.action) {
        case 'create': {
          const { table } = body
          const { data, error } = await supabase
            .from('restaurant_tables')
            .insert(table)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'update': {
          const { tableId, updates } = body
          const { data, error } = await supabase
            .from('restaurant_tables')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', tableId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'update_status': {
          const { tableId, status } = body
          const { data, error } = await supabase
            .from('restaurant_tables')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', tableId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'create_reservation': {
          const { reservation } = body

          // Check table availability
          const { data: existing } = await supabase
            .from('restaurant_reservations')
            .select('id')
            .eq('table_id', reservation.table_id)
            .eq('status', 'confirmed')
            .gte('reservation_time', reservation.reservation_time)
            .lte('reservation_time', new Date(new Date(reservation.reservation_time).getTime() + 2 * 60 * 60 * 1000).toISOString())
            .single()

          if (existing) throw new Error('Table not available for this time slot')

          const { data, error } = await supabase
            .from('restaurant_reservations')
            .insert({ ...reservation, status: 'confirmed' })
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'update_reservation': {
          const { reservationId, updates } = body
          const { data, error } = await supabase
            .from('restaurant_reservations')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', reservationId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'cancel_reservation': {
          const { reservationId, reason } = body
          const { data, error } = await supabase
            .from('restaurant_reservations')
            .update({ status: 'cancelled', cancel_reason: reason, updated_at: new Date().toISOString() })
            .eq('id', reservationId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'merge': {
          const { tableIds, partySize } = body
          // Create a merged table record
          const { data: tables } = await supabase
            .from('restaurant_tables')
            .select('*')
            .in('id', tableIds)

          const totalCapacity = (tables || []).reduce((sum, t) => sum + (t.capacity || 0), 0)

          const { data, error } = await supabase
            .from('restaurant_tables')
            .insert({
              table_number: `M-${Date.now()}`,
              capacity: totalCapacity,
              status: 'occupied',
              section: tables?.[0]?.section || 'main',
              merged_from: tableIds,
              party_size: partySize,
            })
            .select()
            .single()
          if (error) throw error

          // Mark original tables as merged
          await supabase
            .from('restaurant_tables')
            .update({ status: 'merged', merged_into: data.id })
            .in('id', tableIds)

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
