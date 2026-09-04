import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispatchBody {
  delivery_type: 'boda' | 'mtaxi' | 'mtruck' | 'in_house'
  order_id: string
  shop_id: string
  pickup_address?: string
  dropoff_address?: string
  customer_phone?: string
  delivery_notes?: string
  coords?: { lat: number; lng: number }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      delivery_type,
      order_id,
      shop_id,
      pickup_address,
      dropoff_address,
      customer_phone,
      delivery_notes,
      coords,
    }: DispatchBody = await req.json()

    // Verify order exists and belongs to shop
    const { data: order, error: orderErr } = await supabase
      .from('shop_orders')
      .select('id, shop_id, status, shipping_address')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (order.shop_id !== shop_id) {
      return new Response(JSON.stringify({ error: 'Shop mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let external_trip_id: string | null = null
    let external_module: string | null = null
    let estimated_fare: number | null = null
    let status = 'pending'

    // Dispatch to external modules
    if (delivery_type === 'boda') {
      const { data, error } = await supabase.functions.invoke('boda-operations', {
        body: {
          action: 'create_trip',
          pickup: pickup_address,
          dropoff: dropoff_address,
          phone: customer_phone,
          coords,
        },
      })
      if (error) throw error
      external_trip_id = data?.trip_id ?? null
      external_module = 'boda'
      estimated_fare = data?.estimated_fare ?? null
      status = 'assigned'
    } else if (delivery_type === 'mtaxi') {
      const { data, error } = await supabase.functions.invoke('mtaxi-request', {
        body: {
          action: 'request_ride',
          pickup: pickup_address,
          dropoff: dropoff_address,
          phone: customer_phone,
          coords,
        },
      })
      if (error) throw error
      external_trip_id = data?.ride_id ?? null
      external_module = 'mtaxi'
      estimated_fare = data?.estimated_fare ?? null
      status = 'assigned'
    } else if (delivery_type === 'mtruck') {
      const { data, error } = await supabase.functions.invoke('mtruck-settle', {
        body: {
          action: 'dispatch',
          pickup: pickup_address,
          dropoff: dropoff_address,
          phone: customer_phone,
          coords,
        },
      })
      if (error) throw error
      external_trip_id = data?.trip_id ?? null
      external_module = 'mtruck'
      estimated_fare = data?.estimated_fare ?? null
      status = 'assigned'
    }

    // Insert delivery request
    const { data: deliveryReq, error: insertErr } = await supabase
      .from('shop_delivery_requests')
      .insert({
        order_id,
        shop_id,
        delivery_type,
        external_trip_id,
        external_module,
        status,
        pickup_address,
        dropoff_address,
        estimated_fare,
        customer_phone,
        delivery_notes,
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    return new Response(
      JSON.stringify({ success: true, delivery_request: deliveryReq }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
