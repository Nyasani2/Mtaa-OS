import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
    let result: any

    if (req.method === 'POST') {
      const body = await req.json()
      const { action: postAction, payload, orderId, status, reason } = body
      
      // 2. Verify user is staff/owner of a restaurant
      const { data: staff, error: staffErr } = await supabase.from('restaurant_staff').select('shop_id, role').eq('user_id', user.id).single();
      if (staffErr || !staff) return new Response(JSON.stringify({ error: 'Unauthorized: Not a restaurant staff member' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      switch (postAction) {
        case 'create': {
          if (payload.shop_id !== staff.shop_id && staff.role !== 'owner') {
             return new Response(JSON.stringify({ error: 'Unauthorized for this shop' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          const total = payload.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unit_price || 0)), 0);
          const { data: order, error: orderError } = await supabase.from('restaurant_orders').insert({
            shop_id: staff.shop_id, table_id: payload.table_id, customer_id: payload.customer_id, order_type: payload.order_type,
            status: 'pending', notes: payload.notes, total_amount: total
          }).select().single();
          if (orderError) throw orderError;
          const orderItems = payload.items.map((item: any) => ({ order_id: order.id, menu_item_id: item.menu_item_id, quantity: item.quantity, unit_price: item.unit_price || 0 }));
          await supabase.from('restaurant_order_items').insert(orderItems);
          result = order;
          break;
        }
        case 'update_status': {
          await supabase.from('restaurant_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
          result = { success: true };
          break;
        }
        case 'payment': {
          await supabase.from('restaurant_orders').update({ payment_status: 'paid', paid_at: new Date().toISOString(), status: 'completed' }).eq('id', orderId);
          result = { success: true };
          break;
        }
        case 'cancel': {
          await supabase.from('restaurant_orders').update({ status: 'cancelled', cancel_reason: reason }).eq('id', orderId);
          result = { success: true };
          break;
        }
        default:
          return new Response(JSON.stringify({ error: 'Unknown POST action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      // For GET, ensure they can only list orders for their shop
      let query = supabase.from('restaurant_orders').select('*, items:restaurant_order_items(*)', { count: 'exact' }).eq('shop_id', staff.shop_id);
      if (action === 'get') query = query.eq('id', url.searchParams.get('id'));
      const { data, error, count } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      result = action === 'get' ? data : { orders: data || [], total: count || 0 };
    }
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
