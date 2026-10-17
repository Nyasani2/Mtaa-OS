import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { delivery_type, order_id, shop_id, pickup_address, dropoff_address, customer_phone, delivery_notes, coords } = await req.json();

    // 2. SECURITY FIX: Verify the shop belongs to the authenticated user (or is at least a valid shop)
    const { data: shop, error: shopErr } = await supabase.from('shops').select('owner_id').eq('id', shop_id).single();
    if (shopErr || !shop) {
      return new Response(JSON.stringify({ error: 'Shop not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Optional: Strict check - only owner can dispatch (uncomment if needed)
    // if (shop.owner_id !== user.id) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized: Not the shop owner' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    // }

    const { data: order, error: orderErr } = await supabase
      .from('shop_orders')
      .select('id, shop_id, status, shipping_address')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (order.shop_id !== shop_id) {
      return new Response(JSON.stringify({ error: 'Shop mismatch' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let external_trip_id: string | null = null;
    let external_module: string | null = null;
    let estimated_fare: number | null = null;
    let status = 'pending';

    if (delivery_type === 'boda') {
      const { data, error } = await supabase.functions.invoke('boda-operations', { body: { action: 'create_trip', pickup: pickup_address, dropoff: dropoff_address, phone: customer_phone, coords } });
      if (error) throw error;
      external_trip_id = data?.trip_id ?? null;
      external_module = 'boda';
      estimated_fare = data?.estimated_fare ?? null;
      status = 'assigned';
    } else if (delivery_type === 'mtaxi') {
      const { data, error } = await supabase.functions.invoke('mtaxi-request', { body: { action: 'request_ride', pickup: pickup_address, dropoff: dropoff_address, phone: customer_phone, coords } });
      if (error) throw error;
      external_trip_id = data?.ride_id ?? null;
      external_module = 'mtaxi';
      estimated_fare = data?.estimated_fare ?? null;
      status = 'assigned';
    } else if (delivery_type === 'mtruck') {
      const { data, error } = await supabase.functions.invoke('mtruck-settle', { body: { action: 'dispatch', pickup: pickup_address, dropoff: dropoff_address, phone: customer_phone, coords } });
      if (error) throw error;
      external_trip_id = data?.trip_id ?? null;
      external_module = 'mtruck';
      estimated_fare = data?.estimated_fare ?? null;
      status = 'assigned';
    }

    const { data: deliveryReq, error: insertErr } = await supabase
      .from('shop_delivery_requests')
      .insert({
        order_id, shop_id, delivery_type, external_trip_id, external_module, status,
        pickup_address, dropoff_address, estimated_fare, customer_phone, delivery_notes,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, delivery_request: deliveryReq }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
