// supabase/functions/restaurant-inventory/index.ts
// MTAA Restaurant — Inventory Management Edge Function
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
  const action = url.searchParams.get('action') || 'get_items'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'get_items': {
          let query = supabase
            .from('restaurant_inventory')
            .select('*', { count: 'exact' })

          const category = url.searchParams.get('category')
          const low_stock = url.searchParams.get('low_stock')
          const search = url.searchParams.get('search')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          if (category) query = query.eq('category', category)
          if (low_stock === 'true') query = query.lte('current_quantity', supabase.raw('reorder_level'))
          if (search) query = query.ilike('name', `%${search}%`)

          const { data, error, count } = await query
            .order('name')
            .range(offset, offset + limit - 1)
          if (error) throw error
          result = { items: data || [], total: count || 0 }
          break
        }
        case 'low_stock': {
          const { data, error } = await supabase
            .from('restaurant_inventory')
            .select('*')
            .lte('current_quantity', supabase.raw('reorder_level'))
            .order('current_quantity', { ascending: true })
          if (error) throw error
          result = data || []
          break
        }
        case 'transactions': {
          let query = supabase
            .from('restaurant_inventory_transactions')
            .select('*', { count: 'exact' })

          const item_id = url.searchParams.get('item_id')
          const type = url.searchParams.get('type')
          const date_from = url.searchParams.get('date_from')
          const date_to = url.searchParams.get('date_to')
          const limit = parseInt(url.searchParams.get('limit') || '50')

          if (item_id) query = query.eq('item_id', item_id)
          if (type) query = query.eq('type', type)
          if (date_from) query = query.gte('created_at', date_from)
          if (date_to) query = query.lte('created_at', date_to)

          const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .limit(limit)
          if (error) throw error
          result = { transactions: data || [], total: count || 0 }
          break
        }
        case 'valuation': {
          const { data, error } = await supabase
            .from('restaurant_inventory')
            .select('category, current_quantity, unit_cost')
          if (error) throw error

          const total_value = (data || []).reduce((sum, item) => 
            sum + ((item.current_quantity || 0) * (item.unit_cost || 0)), 0
          )

          const by_category: Record<string, number> = {}
          for (const item of data || []) {
            const val = (item.current_quantity || 0) * (item.unit_cost || 0)
            by_category[item.category] = (by_category[item.category] || 0) + val
          }

          result = {
            total_value: Math.round(total_value * 100) / 100,
            by_category,
            item_count: data?.length || 0,
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
          const { item } = body
          const { data, error } = await supabase
            .from('restaurant_inventory')
            .insert(item)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'update': {
          const { itemId, updates } = body
          const { data, error } = await supabase
            .from('restaurant_inventory')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'transaction': {
          const { payload } = body

          const { data: tx, error: txError } = await supabase
            .from('restaurant_inventory_transactions')
            .insert({
              item_id: payload.item_id,
              type: payload.type,
              quantity: payload.quantity,
              unit_cost: payload.unit_cost,
              reason: payload.reason,
              supplier_id: payload.supplier_id,
              order_id: payload.order_id,
            })
            .select()
            .single()
          if (txError) throw txError

          const { data: item } = await supabase
            .from('restaurant_inventory')
            .select('current_quantity')
            .eq('id', payload.item_id)
            .single()

          let newQty = item?.current_quantity || 0
          if (payload.type === 'purchase' || payload.type === 'adjustment') {
            newQty += payload.quantity
          } else if (payload.type === 'usage' || payload.type === 'waste') {
            newQty -= payload.quantity
          }

          await supabase
            .from('restaurant_inventory')
            .update({ current_quantity: Math.max(0, newQty), updated_at: new Date().toISOString() })
            .eq('id', payload.item_id)

          result = tx
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
