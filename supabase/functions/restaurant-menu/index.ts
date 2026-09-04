// supabase/functions/restaurant-menu/index.ts
// MTAA Restaurant — Menu Management Edge Function
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
  const action = url.searchParams.get('action') || 'items'

  try {
    let result: any

    if (req.method === 'GET') {
      switch (action) {
        case 'categories': {
          const { data, error } = await supabase
            .from('restaurant_menu_categories')
            .select('*')
            .order('sort_order')
          if (error) throw error
          result = data || []
          break
        }
        case 'items': {
          let query = supabase
            .from('restaurant_menu_items')
            .select('*, category:restaurant_menu_categories(name)', { count: 'exact' })

          const category_id = url.searchParams.get('category_id')
          const available = url.searchParams.get('available')
          const search = url.searchParams.get('search')
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          if (category_id) query = query.eq('category_id', category_id)
          if (available !== null) query = query.eq('is_available', available === 'true')
          if (search) query = query.ilike('name', `%${search}%`)

          const { data, error, count } = await query
            .order('name')
            .range(offset, offset + limit - 1)
          if (error) throw error
          result = { items: data || [], total: count || 0 }
          break
        }
        case 'item': {
          const id = url.searchParams.get('id')
          const { data, error } = await supabase
            .from('restaurant_menu_items')
            .select('*, category:restaurant_menu_categories(*)')
            .eq('id', id)
            .single()
          if (error) throw error
          result = data
          break
        }
        default:
          throw new Error(`Unknown GET action: ${action}`)
      }
    } else if (req.method === 'POST') {
      const body = await req.json()

      switch (body.action) {
        case 'create_category': {
          const { category } = body
          const { data, error } = await supabase
            .from('restaurant_menu_categories')
            .insert(category)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'create_item': {
          const { item } = body
          const { data, error } = await supabase
            .from('restaurant_menu_items')
            .insert(item)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'update_item': {
          const { itemId, updates } = body
          const { data, error } = await supabase
            .from('restaurant_menu_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'toggle_availability': {
          const { itemId, available } = body
          const { data, error } = await supabase
            .from('restaurant_menu_items')
            .update({ is_available: available, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .select()
            .single()
          if (error) throw error
          result = data
          break
        }
        case 'delete_item': {
          const { itemId } = body
          const { error } = await supabase
            .from('restaurant_menu_items')
            .delete()
            .eq('id', itemId)
          if (error) throw error
          result = { success: true }
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
