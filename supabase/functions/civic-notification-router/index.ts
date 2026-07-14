import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { jurisdiction_id, notification_type, title, body, metadata } = await req.json()

    // Get all personnel in jurisdiction
    const { data: personnel } = await supabase
      .from('civic_personnel')
      .select('user_id')
      .eq('jurisdiction_id', jurisdiction_id)
      .eq('is_active', true)

    const notifications = (personnel || []).map(p => ({
      user_id: p.user_id,
      type: notification_type,
      title,
      body,
      metadata: metadata || {},
      is_read: false
    }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
    }

    return new Response(JSON.stringify({ 
      sent: notifications.length,
      jurisdiction_id
    }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
