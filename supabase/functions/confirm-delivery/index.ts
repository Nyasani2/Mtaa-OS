import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    const authenticatedUserId = user.id
    const { order_id, buyer_id } = await req.json()

    if (buyer_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You can only confirm delivery for your own orders', code: 'UNAUTHORIZED' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id', code: 'INVALID_REQUEST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('*, profiles:seller_id (first_name, last_name)').eq('id', order_id).eq('buyer_id', buyer_id).single()
    if (orderError || !order) return new Response(JSON.stringify({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (!['shipped', 'delivered'].includes(order.status)) return new Response(JSON.stringify({ error: `Cannot confirm delivery. Status: ${order.status}`, code: 'INVALID_STATUS' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { error: rpcError } = await supabaseAdmin.rpc('confirm_delivery', { p_order_id: order_id, p_buyer_id: buyer_id })
    if (rpcError) return new Response(JSON.stringify({ error: rpcError.message, code: 'RPC_ERROR' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    return new Response(JSON.stringify({ success: true, order_id, status: 'completed', message: 'Delivery confirmed. Payment released to seller.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
