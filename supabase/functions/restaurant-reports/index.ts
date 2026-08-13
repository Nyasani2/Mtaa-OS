// supabase/functions/restaurant-reports/index.ts
// MTAA Restaurant — Reports & Analytics Edge Function
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
  const action = url.searchParams.get('action') || 'dashboard'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'dashboard': {
          const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
          const dateStart = `${date}T00:00:00`
          const dateEnd = `${date}T23:59:59`

          const { data: sales, error: sErr } = await supabase
            .from('restaurant_orders')
            .select('total_amount, tip_amount, status')
            .gte('created_at', dateStart)
            .lte('created_at', dateEnd)
          if (sErr) throw sErr

          const completedOrders = (sales || []).filter((o: any) => o.status === 'completed')
          const totalSales = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
          const totalTips = completedOrders.reduce((sum, o) => sum + (o.tip_amount || 0), 0)
          const orderCount = completedOrders.length
          const avgTicket = orderCount > 0 ? totalSales / orderCount : 0

          const { data: tables, error: tErr } = await supabase
            .from('restaurant_tables')
            .select('status')
          if (tErr) throw tErr

          const occupiedTables = (tables || []).filter((t: any) => t.status === 'occupied').length
          const totalTables = tables?.length || 0

          const { data: pending, error: pErr } = await supabase
            .from('restaurant_orders')
            .select('id')
            .in('status', ['pending', 'preparing'])
          if (pErr) throw pErr

          const { data: lowStock, error: lErr } = await supabase
            .from('restaurant_inventory')
            .select('id')
            .lte('current_quantity', supabase.raw('reorder_level'))
          if (lErr) throw lErr

          result = {
            total_sales: Math.round(totalSales * 100) / 100,
            total_tips: Math.round(totalTips * 100) / 100,
            order_count: orderCount,
            average_ticket: Math.round(avgTicket * 100) / 100,
            occupied_tables: occupiedTables,
            total_tables: totalTables,
            table_occupancy_rate: totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0,
            pending_orders: pending?.length || 0,
            low_stock_items: lowStock?.length || 0,
            staff_on_duty: 0,
          }
          break
        }
        case 'daily_sales': {
          const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
          const dateStart = `${date}T00:00:00`
          const dateEnd = `${date}T23:59:59`

          const { data, error } = await supabase
            .from('restaurant_orders')
            .select('created_at, total_amount, tip_amount, payment_method, status')
            .gte('created_at', dateStart)
            .lte('created_at', dateEnd)
            .order('created_at')
          if (error) throw error

          const hourly: Record<string, { sales: number; orders: number; tips: number }> = {}
          for (const order of data || []) {
            const hour = order.created_at.split('T')[1].split(':')[0] + ':00'
            if (!hourly[hour]) hourly[hour] = { sales: 0, orders: 0, tips: 0 }
            if (order.status === 'completed') {
              hourly[hour].sales += order.total_amount || 0
              hourly[hour].tips += order.tip_amount || 0
              hourly[hour].orders += 1
            }
          }

          result = {
            date,
            hourly_breakdown: hourly,
            total_sales: Object.values(hourly).reduce((sum, h) => sum + h.sales, 0),
            total_orders: Object.values(hourly).reduce((sum, h) => sum + h.orders, 0),
            total_tips: Object.values(hourly).reduce((sum, h) => sum + h.tips, 0),
          }
          break
        }
        case 'sales_period': {
          const period = url.searchParams.get('period') || 'day'
          const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

          let startDate = new Date(date)
          let labels: string[] = []
          let sales: number[] = []
          let orders: number[] = []
          let avgTicket: number[] = []

          if (period === 'day') {
            for (let i = 0; i < 24; i++) {
              labels.push(`${i.toString().padStart(2, '0')}:00`)
              sales.push(0)
              orders.push(0)
            }
          } else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 6)
            for (let i = 0; i < 7; i++) {
              const d = new Date(startDate)
              d.setDate(d.getDate() + i)
              labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }))
              sales.push(0)
              orders.push(0)
            }
          } else if (period === 'month') {
            startDate.setDate(1)
            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
            for (let i = 1; i <= daysInMonth; i++) {
              labels.push(i.toString())
              sales.push(0)
              orders.push(0)
            }
          }

          const { data, error } = await supabase
            .from('restaurant_orders')
            .select('created_at, total_amount, status')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', new Date(date).toISOString())
          if (error) throw error

          for (const order of data || []) {
            if (order.status !== 'completed') continue
            const orderDate = new Date(order.created_at)
            let idx = 0

            if (period === 'day') {
              idx = orderDate.getHours()
            } else if (period === 'week') {
              idx = Math.floor((orderDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            } else if (period === 'month') {
              idx = orderDate.getDate() - 1
            }

            if (idx >= 0 && idx < sales.length) {
              sales[idx] += order.total_amount || 0
              orders[idx] += 1
            }
          }

          for (let i = 0; i < sales.length; i++) {
            avgTicket.push(orders[i] > 0 ? Math.round((sales[i] / orders[i]) * 100) / 100 : 0)
          }

          result = { labels, sales, orders, average_ticket: avgTicket }
          break
        }
        case 'p&l': {
          const startDate = url.searchParams.get('start_date') || new Date().toISOString().split('T')[0]
          const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0]

          const { data: revenue, error: rErr } = await supabase
            .from('restaurant_orders')
            .select('total_amount')
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
          if (rErr) throw rErr
          const totalRevenue = (revenue || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)

          const { data: cogs, error: cErr } = await supabase
            .from('restaurant_inventory_transactions')
            .select('quantity, unit_cost')
            .eq('type', 'usage')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
          if (cErr) throw cErr
          const totalCogs = (cogs || []).reduce((sum, t) => sum + ((t.quantity || 0) * (t.unit_cost || 0)), 0)

          const { data: labor, error: lErr } = await supabase
            .from('restaurant_payroll')
            .select('gross_pay')
            .eq('status', 'paid')
            .gte('period_start', startDate)
            .lte('period_end', endDate)
          if (lErr) throw lErr
          const totalLabor = (labor || []).reduce((sum, p) => sum + (p.gross_pay || 0), 0)

          const grossProfit = totalRevenue - totalCogs
          const operatingExpenses = totalLabor + (totalRevenue * 0.15)
          const netProfit = grossProfit - operatingExpenses
          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

          result = {
            revenue: Math.round(totalRevenue * 100) / 100,
            cogs: Math.round(totalCogs * 100) / 100,
            gross_profit: Math.round(grossProfit * 100) / 100,
            labor_cost: Math.round(totalLabor * 100) / 100,
            operating_expenses: Math.round(operatingExpenses * 100) / 100,
            net_profit: Math.round(netProfit * 100) / 100,
            profit_margin: Math.round(profitMargin * 100) / 100,
          }
          break
        }
        case 'top_items': {
          const period = url.searchParams.get('period') || 'today'
          const limit = parseInt(url.searchParams.get('limit') || '10')

          let startDate = new Date()
          if (period === 'week') startDate.setDate(startDate.getDate() - 7)
          else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1)
          else startDate.setHours(0, 0, 0, 0)

          const { data, error } = await supabase
            .from('restaurant_order_items')
            .select('menu_item_id, quantity, unit_price, menu_item:restaurant_menu_items(name)')
            .gte('created_at', startDate.toISOString())
          if (error) throw error

          const itemMap: Record<string, any> = {}
          for (const item of data || []) {
            const id = item.menu_item_id
            if (!itemMap[id]) {
              itemMap[id] = {
                menu_item_id: id,
                name: (item.menu_item as any)?.name || 'Unknown',
                quantity_sold: 0,
                revenue: 0,
              }
            }
            itemMap[id].quantity_sold += item.quantity || 0
            itemMap[id].revenue += (item.quantity || 0) * (item.unit_price || 0)
          }

          result = Object.values(itemMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit)
          break
        }
        case 'staff_performance': {
          const staff_id = url.searchParams.get('staff_id')
          const period = url.searchParams.get('period') || 'today'

          let startDate = new Date()
          if (period === 'week') startDate.setDate(startDate.getDate() - 7)
          else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1)
          else startDate.setHours(0, 0, 0, 0)

          let query = supabase
            .from('restaurant_orders')
            .select('server_id, total_amount, tip_amount, status')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString())

          if (staff_id) query = query.eq('server_id', staff_id)

          const { data, error } = await query
          if (error) throw error

          const staffMap: Record<string, any> = {}
          for (const order of data || []) {
            const id = order.server_id || 'unknown'
            if (!staffMap[id]) {
              staffMap[id] = {
                staff_id: id,
                name: 'Staff Member',
                orders_served: 0,
                sales_total: 0,
                avg_ticket: 0,
                tips: 0,
              }
            }
            staffMap[id].orders_served += 1
            staffMap[id].sales_total += order.total_amount || 0
            staffMap[id].tips += order.tip_amount || 0
          }

          for (const id in staffMap) {
            const s = staffMap[id]
            s.avg_ticket = s.orders_served > 0 ? Math.round((s.sales_total / s.orders_served) * 100) / 100 : 0
            s.sales_total = Math.round(s.sales_total * 100) / 100
            s.tips = Math.round(s.tips * 100) / 100
          }

          result = Object.values(staffMap)
          break
        }
        default:
          throw new Error(`Unknown GET action: ${action}`)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()

      switch (body.action) {
        case 'export_csv': {
          const { reportType, filters } = body
          const csvContent = `Report Type: ${reportType}\nGenerated: ${new Date().toISOString()}\nFilters: ${JSON.stringify(filters)}\n\nThis is a placeholder CSV export.`
          result = { download_url: `data:text/csv;base64,${btoa(csvContent)}` }
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
