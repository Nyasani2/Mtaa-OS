// supabase/functions/restaurant-orders/index.ts
// MTAA Restaurant — Order Management Edge Function
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
  const action = url.searchParams.get('action') || 'list'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'get': {
          const id = url.searchParams.get('id')
          const { data, error } = await supabase
            .from('restaurant_orders')
            .select('*, items:restaurant_order_items(*)')
            .eq('id', id)
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'list': {
          let query = supabase
            .from('restaurant_orders')
            .select('*, items:restaurant_order_items(*)', { count: 'exact' })

          const status = url.searchParams.get('status')
          const table_id = url.searchParams.get('table_id')
          const customer_id = url.searchParams.get('customer_id')
          const date_from = url.searchParams.get('date_from')
          const date_to = url.searchParams.get('date_to')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          if (status) query = query.eq('status', status)
          if (table_id) query = query.eq('table_id', table_id)
          if (customer_id) query = query.eq('customer_id', customer_id)
          if (date_from) query = query.gte('created_at', date_from)
          if (date_to) query = query.lte('created_at', date_to)

          const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

          if (error) throw error
          result = { orders: data || [], total: count || 0 }
          break
        }
        case 'table_orders': {
          const table_id = url.searchParams.get('table_id')
          const { data, error } = await supabase
            .from('restaurant_orders')
            .select('*, items:restaurant_order_items(*)')
            .eq('table_id', table_id)
            .in('status', ['pending', 'preparing', 'ready'])
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
        case 'create': {
          const { payload } = body
          const { data: order, error: orderError } = await supabase
            .from('restaurant_orders')
            .insert({
              table_id: payload.table_id,
              customer_id: payload.customer_id,
              order_type: payload.order_type,
              status: 'pending',
              notes: payload.notes,
              delivery_address: payload.delivery_address,
              total_amount: payload.items.reduce((sum: number, item: any) => 
                sum + (item.quantity * (item.unit_price || 0)), 0
              ),
            })
            .select()
            .single()
          if (orderError) throw orderError

          const items = payload.items.map((item: any) => ({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price || 0,
            modifiers: item.modifiers,
            notes: item.notes,
          }))

          const { error: itemsError } = await supabase
            .from('restaurant_order_items')
            .insert(items)
          if (itemsError) throw itemsError

          result = order
          break
        }
        case 'update_status': {
          const { orderId, status, reason } = body
          const { data, error } = await supabase
            .from('restaurant_orders')
            .update({ status, status_reason: reason, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'add_items': {
          const { orderId, items } = body
          const orderItems = items.map((item: any) => ({
            order_id: orderId,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price || 0,
            modifiers: item.modifiers,
            notes: item.notes,
          }))
          const { error } = await supabase
            .from('restaurant_order_items')
            .insert(orderItems)
          if (error) throw error

          const { data: order } = await supabase
            .from('restaurant_orders')
            .select('total_amount')
            .eq('id', orderId)
            .single()

          const newTotal = (order?.total_amount || 0) + items.reduce((sum: number, item: any) => 
            sum + (item.quantity * (item.unit_price || 0)), 0
          )

          await supabase
            .from('restaurant_orders')
            .update({ total_amount: newTotal })
            .eq('id', orderId)

          result = { success: true }
          break
        }
        case 'void_item': {
          const { orderId, itemId, reason } = body
          const { error } = await supabase
            .from('restaurant_order_items')
            .update({ status: 'voided', void_reason: reason })
            .eq('id', itemId)
            .eq('order_id', orderId)
          if (error) throw error
          result = { success: true }
          break
        }
        case 'payment': {
          const { orderId, payload } = body
          const { data: order, error } = await supabase
            .from('restaurant_orders')
            .update({
              payment_status: 'paid',
              payment_method: payload.method,
              tip_amount: payload.tip || 0,
              paid_at: new Date().toISOString(),
              status: 'completed',
            })
            .eq('id', orderId)
            .select()
            .single()
          if (error) throw error
          result = { order, transaction_id: crypto.randomUUID() }
          break
        }
        case 'split': {
          const { orderId, splits } = body
          const splitRecords = splits.map((split: any, idx: number) => ({
            order_id: orderId,
            split_index: idx + 1,
            amount: split.amount,
            method: split.method,
            customer_id: split.customer_id,
            status: 'pending',
          }))
          const { error } = await supabase
            .from('restaurant_order_splits')
            .insert(splitRecords)
          if (error) throw error
          result = { success: true }
          break
        }
        case 'cancel': {
          const { orderId, reason } = body
          const { data, error } = await supabase
            .from('restaurant_orders')
            .update({ status: 'cancelled', cancel_reason: reason })
            .eq('id', orderId)
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
