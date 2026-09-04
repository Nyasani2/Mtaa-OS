import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { action, device_id } = body

    if (!action || !device_id) {
      return new Response(JSON.stringify({ error: 'Missing action or device_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify device access
    const { data: device } = await supabase
      .from('devices')
      .select('*')
      .eq('id', device_id)
      .single()

    if (!device) {
      return new Response(JSON.stringify({ error: 'Device not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Log the operation
    await supabase.from('device_logs').insert({
      device_id,
      action,
      performed_by: user.id,
      details: body,
    })

    let result: any = { success: true, action, device_id }

    switch (action) {
      case 'start_preview':
        result = { ...result, status: 'preview_started', stream_url: null }
        break
      case 'stop_preview':
        result = { ...result, status: 'preview_stopped' }
        break
      case 'capture_snapshot':
        result = { ...result, status: 'snapshot_captured', path: `snapshots/${device_id}/${Date.now()}.jpg` }
        break
      case 'toggle_torch':
        result = { ...result, status: 'torch_toggled', on: body.on }
        break
      case 'set_zoom':
        result = { ...result, status: 'zoom_set', zoom: body.zoom }
        break
      case 'switch_camera':
        result = { ...result, status: 'camera_switched', camera: body.camera }
        break
      case 'night_mode':
        result = { ...result, status: 'night_mode_set', enabled: body.enabled }
        break
      case 'start_recording':
        result = { ...result, status: 'recording_started', recording_id: `REC-${Date.now()}` }
        break
      case 'stop_recording':
        result = { ...result, status: 'recording_stopped' }
        break
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
