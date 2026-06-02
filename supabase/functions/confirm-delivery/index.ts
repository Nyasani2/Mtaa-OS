import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id, buyer_id } = await req.json()

    if (!order_id || !buyer_id) {
      return new Response(
        JSON.stringify({ error: 'Missing order_id or buyer_id', code: 'INVALID_REQUEST' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify order ownership and status
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, profiles:seller_id (first_name, last_name)')
      .eq('id', order_id)
      .eq('buyer_id', buyer_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['shipped', 'delivered'].includes(order.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot confirm delivery. Status: ${order.status}`, code: 'INVALID_STATUS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call RPC to release escrow and complete order
    const { error: rpcError } = await supabaseClient.rpc('confirm_delivery', {
      p_order_id: order_id,
      p_buyer_id: buyer_id,
    })

    if (rpcError) {
      return new Response(
        JSON.stringify({ error: rpcError.message, code: 'RPC_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        status: 'completed',
        message: 'Delivery confirmed. Payment released to seller.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
