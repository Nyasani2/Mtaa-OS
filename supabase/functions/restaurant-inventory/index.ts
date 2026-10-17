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

    // 2. Verify user is staff/owner
    const { data: staff, error: staffErr } = await supabase.from('restaurant_staff').select('shop_id, role').eq('user_id', user.id).single();
    if (staffErr || !staff) return new Response(JSON.stringify({ error: 'Unauthorized: Not a restaurant staff member' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'get_items'
    let result: any

    if (req.method === 'POST') {
      const body = await req.json()
      const { action: postAction, item, itemId, updates, payload } = body
      
      switch (postAction) {
        case 'create': {
          item.shop_id = staff.shop_id; // Force shop_id
          const { data, error } = await supabase.from('restaurant_inventory').insert(item).select().single();
          if (error) throw error;
          result = data;
          break;
        }
        case 'update': {
          const { data, error } = await supabase.from('restaurant_inventory').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', itemId).eq('shop_id', staff.shop_id).select().single();
          if (error) throw error;
          result = data;
          break;
        }
        case 'transaction': {
          const { data: tx, error: txError } = await supabase.from('restaurant_inventory_transactions').insert({ item_id: payload.item_id, type: payload.type, quantity: payload.quantity, unit_cost: payload.unit_cost, reason: payload.reason }).select().single();
          if (txError) throw txError;
          const { data: invItem } = await supabase.from('restaurant_inventory').select('current_quantity').eq('id', payload.item_id).eq('shop_id', staff.shop_id).single();
          let newQty = invItem?.current_quantity || 0;
          if (payload.type === 'purchase' || payload.type === 'adjustment') newQty += payload.quantity;
          else if (payload.type === 'usage' || payload.type === 'waste') newQty -= payload.quantity;
          await supabase.from('restaurant_inventory').update({ current_quantity: Math.max(0, newQty), updated_at: new Date().toISOString() }).eq('id', payload.item_id).eq('shop_id', staff.shop_id);
          result = tx;
          break;
        }
        default:
          return new Response(JSON.stringify({ error: 'Unknown POST action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      let query = supabase.from('restaurant_inventory').select('*', { count: 'exact' }).eq('shop_id', staff.shop_id);
      if (action === 'low_stock') query = query.lte('current_quantity', supabase.raw('reorder_level'));
      const { data, error, count } = await query.order('name').limit(100);
      if (error) throw error;
      result = action === 'low_stock' ? (data || []) : { items: data || [], total: count || 0 };
    }
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
