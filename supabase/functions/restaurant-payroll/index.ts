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

    // 2. Verify user is owner/manager (strict role check for payroll)
    const { data: staff, error: staffErr } = await supabase.from('restaurant_staff').select('shop_id, role').eq('user_id', user.id).single();
    if (staffErr || !staff || (staff.role !== 'owner' && staff.role !== 'manager')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Owner or Manager role required for payroll' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
    let result: any

    if (req.method === 'POST') {
      const body = await req.json()
      const { action: postAction, staffId, period, payrollId, approvedBy, paymentRef } = body
      
      switch (postAction) {
        case 'generate': {
          const { data: emp, error: empError } = await supabase.from('restaurant_staff').select('id, name, role, hourly_rate, tax_rate, ni_rate, pension_rate').eq('id', staffId).eq('shop_id', staff.shop_id).single();
          if (empError || !emp) throw new Error('Staff not found in your restaurant');
          
          const { data: attendance } = await supabase.from('restaurant_attendance').select('hours_worked').eq('staff_id', staffId).gte('clock_in', period.start_date).lte('clock_in', period.end_date).not('clock_out', 'is', null);
          const totalHours = (attendance || []).reduce((sum, a) => sum + (a.hours_worked || 0), 0);
          const regularHours = Math.min(totalHours, 40);
          const overtimeHours = Math.max(0, totalHours - 40);
          const grossPay = (regularHours * (emp.hourly_rate || 0)) + (overtimeHours * (emp.hourly_rate || 0) * 1.5);
          const tax = grossPay * (emp.tax_rate || 0.15);
          const ni = grossPay * (emp.ni_rate || 0.05);
          const pension = grossPay * (emp.pension_rate || 0.03);
          
          const { data, error } = await supabase.from('restaurant_payroll').insert({
            shop_id: staff.shop_id, staff_id: staffId, period_start: period.start_date, period_end: period.end_date,
            total_hours: totalHours, regular_hours: regularHours, overtime_hours: overtimeHours, gross_pay: grossPay,
            tax_deduction: tax, ni_deduction: ni, pension_deduction: pension, net_pay: grossPay - tax - ni - pension, status: 'draft'
          }).select().single();
          if (error) throw error;
          result = data;
          break;
        }
        case 'approve': {
          const { data, error } = await supabase.from('restaurant_payroll').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', payrollId).eq('shop_id', staff.shop_id).select().single();
          if (error) throw error;
          result = data;
          break;
        }
        case 'mark_paid': {
          const { data, error } = await supabase.from('restaurant_payroll').update({ status: 'paid', payment_ref: paymentRef, paid_at: new Date().toISOString() }).eq('id', payrollId).eq('shop_id', staff.shop_id).select().single();
          if (error) throw error;
          result = data;
          break;
        }
        default:
          return new Response(JSON.stringify({ error: 'Unknown POST action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      let query = supabase.from('restaurant_payroll').select('*, staff:restaurant_staff(name, role)', { count: 'exact' }).eq('shop_id', staff.shop_id);
      const { data, error, count } = await query.order('period_end', { ascending: false }).limit(50);
      if (error) throw error;
      result = { records: data || [], total: count || 0 };
    }
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
