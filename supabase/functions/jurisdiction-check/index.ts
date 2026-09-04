import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { userId, jurisdictionId, requiredRole } = await req.json()

    const { data: personnel, error } = await supabase
      .from('civic_personnel')
      .select('*')
      .eq('user_id', userId)
      .eq('jurisdiction_id', jurisdictionId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error

    if (!personnel) {
      return new Response(JSON.stringify({ 
        authorized: false, 
        reason: 'Not assigned to this jurisdiction' 
      }), { status: 403 })
    }

    if (requiredRole && personnel.role !== requiredRole && personnel.role !== 'super_admin') {
      return new Response(JSON.stringify({ 
        authorized: false, 
        reason: `Role ${personnel.role} does not match required ${requiredRole}` 
      }), { status: 403 })
    }

    return new Response(JSON.stringify({ 
      authorized: true,
      role: personnel.role,
      permissions: personnel.permissions
    }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
