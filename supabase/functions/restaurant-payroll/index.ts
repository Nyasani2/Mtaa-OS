// supabase/functions/restaurant-payroll/index.ts
// MTAA Restaurant — Payroll Edge Function
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
  const action = url.searchParams.get('action') || 'list'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'get': {
          const id = url.searchParams.get('id')
          const { data, error } = await supabase
            .from('restaurant_payroll')
            .select('*, staff:restaurant_staff(name, role, hourly_rate)')
            .eq('id', id)
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'list': {
          let query = supabase
            .from('restaurant_payroll')
            .select('*, staff:restaurant_staff(name, role)', { count: 'exact' })

          const staff_id = url.searchParams.get('staff_id')
          const status = url.searchParams.get('status')
          const period_start = url.searchParams.get('period_start')
          const period_end = url.searchParams.get('period_end')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          if (staff_id) query = query.eq('staff_id', staff_id)
          if (status) query = query.eq('status', status)
          if (period_start) query = query.gte('period_start', period_start)
          if (period_end) query = query.lte('period_end', period_end)

          const { data, error, count } = await query
            .order('period_end', { ascending: false })
            .range(offset, offset + limit - 1)
          if (error) throw error
          result = { records: data || [], total: count || 0 }
          break
        }
        default:
          throw new Error(`Unknown GET action: ${action}`)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()

      switch (body.action) {
        case 'generate': {
          const { staffId, period } = body

          const { data: staff, error: staffError } = await supabase
            .from('restaurant_staff')
            .select('id, name, role, hourly_rate, tax_rate, ni_rate, pension_rate')
            .eq('id', staffId)
            .single()
          if (staffError || !staff) throw new Error('Staff not found')

          const { data: attendance, error: attError } = await supabase
            .from('restaurant_attendance')
            .select('hours_worked')
            .eq('staff_id', staffId)
            .gte('clock_in', period.start_date)
            .lte('clock_in', period.end_date)
            .not('clock_out', 'is', null)
          if (attError) throw attError

          const totalHours = (attendance || []).reduce((sum, a) => sum + (a.hours_worked || 0), 0)
          const regularHours = Math.min(totalHours, 40)
          const overtimeHours = Math.max(0, totalHours - 40)

          const regularPay = regularHours * (staff.hourly_rate || 0)
          const overtimePay = overtimeHours * (staff.hourly_rate || 0) * 1.5
          const grossPay = regularPay + overtimePay

          const tax = grossPay * (staff.tax_rate || 0.15)
          const ni = grossPay * (staff.ni_rate || 0.05)
          const pension = grossPay * (staff.pension_rate || 0.03)
          const netPay = grossPay - tax - ni - pension

          const { data, error } = await supabase
            .from('restaurant_payroll')
            .insert({
              staff_id: staffId,
              period_start: period.start_date,
              period_end: period.end_date,
              total_hours: totalHours,
              regular_hours: regularHours,
              overtime_hours: overtimeHours,
              regular_pay: regularPay,
              overtime_pay: overtimePay,
              gross_pay: grossPay,
              tax_deduction: tax,
              ni_deduction: ni,
              pension_deduction: pension,
              net_pay: netPay,
              status: 'draft',
            })
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'approve': {
          const { payrollId, approvedBy } = body
          const { data, error } = await supabase
            .from('restaurant_payroll')
            .update({ status: 'approved', approved_by: approvedBy, approved_at: new Date().toISOString() })
            .eq('id', payrollId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'mark_paid': {
          const { payrollId, paymentRef } = body
          const { data, error } = await supabase
            .from('restaurant_payroll')
            .update({ status: 'paid', payment_ref: paymentRef, paid_at: new Date().toISOString() })
            .eq('id', payrollId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'tax_summary': {
          const { period } = body
          const { data, error } = await supabase
            .from('restaurant_payroll')
            .select('gross_pay, tax_deduction, ni_deduction, pension_deduction, net_pay')
            .gte('period_start', period.start_date)
            .lte('period_end', period.end_date)
            .eq('status', 'paid')
          if (error) throw error

          const summary = (data || []).reduce((acc, p) => ({
            total_gross: acc.total_gross + (p.gross_pay || 0),
            total_tax: acc.total_tax + (p.tax_deduction || 0),
            total_ni: acc.total_ni + (p.ni_deduction || 0),
            total_pension: acc.total_pension + (p.pension_deduction || 0),
            total_net: acc.total_net + (p.net_pay || 0),
            employee_count: acc.employee_count + 1,
          }), { total_gross: 0, total_tax: 0, total_ni: 0, total_pension: 0, total_net: 0, employee_count: 0 })

          result = summary
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
