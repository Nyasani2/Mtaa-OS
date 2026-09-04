// supabase/functions/restaurant-kds/index.ts
// MTAA Restaurant — Kitchen Display System Edge Function
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
  const action = url.searchParams.get('action') || 'get_tickets'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'get_tickets': {
          let query = supabase
            .from('restaurant_kds_tickets')
            .select('*, items:restaurant_kds_ticket_items(*)')

          const station_id = url.searchParams.get('station_id')
          const status = url.searchParams.get('status')
          const priority = url.searchParams.get('priority')
          const limit = parseInt(url.searchParams.get('limit') || '100')

          if (station_id) query = query.eq('station_id', station_id)
          if (status) query = query.eq('status', status)
          if (priority) query = query.eq('priority', priority)

          const { data, error } = await query
            .order('created_at', { ascending: true })
            .limit(limit)
          if (error) throw error
          result = data || []
          break
        }
        case 'get_stations': {
          const { data, error } = await supabase
            .from('restaurant_kds_stations')
            .select('*')
            .eq('is_active', true)
          if (error) throw error
          result = data || []
          break
        }
        case 'metrics': {
          const period = url.searchParams.get('period') || 'today'
          const now = new Date()
          let startDate = new Date()

          if (period === 'today') startDate.setHours(0, 0, 0, 0)
          else if (period === 'week') startDate.setDate(now.getDate() - 7)
          else if (period === 'month') startDate.setMonth(now.getMonth() - 1)

          const { data: completed, error: cErr } = await supabase
            .from('restaurant_kds_tickets')
            .select('id, prep_time_seconds')
            .eq('status', 'served')
            .gte('updated_at', startDate.toISOString())
          if (cErr) throw cErr

          const { data: pending, error: pErr } = await supabase
            .from('restaurant_kds_tickets')
            .select('id')
            .in('status', ['pending', 'cooking'])
          if (pErr) throw pErr

          const { data: delayed, error: dErr } = await supabase
            .from('restaurant_kds_tickets')
            .select('id')
            .eq('status', 'delayed')
          if (dErr) throw dErr

          const avgPrepTime = completed?.length 
            ? completed.reduce((sum, t) => sum + (t.prep_time_seconds || 0), 0) / completed.length 
            : 0

          result = {
            avg_prep_time: Math.round(avgPrepTime),
            tickets_completed: completed?.length || 0,
            tickets_pending: pending?.length || 0,
            items_delayed: delayed?.length || 0,
          }
          break
        }
        default:
          throw new Error(`Unknown GET action: ${action}`)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()

      switch (body.action) {
        case 'update_status': {
          const { ticketId, status, chefId } = body
          const updates: any = { status, updated_at: new Date().toISOString() }
          if (chefId) updates.chef_id = chefId
          if (status === 'served') {
            updates.served_at = new Date().toISOString()
            const { data: ticket } = await supabase
              .from('restaurant_kds_tickets')
              .select('created_at')
              .eq('id', ticketId)
              .single()
            if (ticket) {
              const prepTime = Math.round((Date.now() - new Date(ticket.created_at).getTime()) / 1000)
              updates.prep_time_seconds = prepTime
            }
          }
          const { data, error } = await supabase
            .from('restaurant_kds_tickets')
            .update(updates)
            .eq('id', ticketId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'start_item': {
          const { ticketId, itemId, chefId } = body
          const { error } = await supabase
            .from('restaurant_kds_ticket_items')
            .update({ status: 'cooking', chef_id: chefId, started_at: new Date().toISOString() })
            .eq('id', itemId)
            .eq('ticket_id', ticketId)
          if (error) throw error
          result = { success: true }
          break
        }
        case 'complete_item': {
          const { ticketId, itemId, chefId } = body
          const { error } = await supabase
            .from('restaurant_kds_ticket_items')
            .update({ status: 'ready', chef_id: chefId, completed_at: new Date().toISOString() })
            .eq('id', itemId)
            .eq('ticket_id', ticketId)
          if (error) throw error
          result = { success: true }
          break
        }
        case 'bump': {
          const { ticketId, serverId } = body
          const { data, error } = await supabase
            .from('restaurant_kds_tickets')
            .update({ 
              status: 'served', 
              server_id: serverId,
              served_at: new Date().toISOString(),
            })
            .eq('id', ticketId)
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
