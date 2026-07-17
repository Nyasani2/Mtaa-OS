// Edge Function: mpesa-daraja
// Routes: /stk-push (POST) and /callback (POST)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import handlers
import { handleStkPush } from './stk-push.ts'
import { handleCallback } from './callback-handler.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/mpesa-daraja/, '').replace(/^\//, '')

  try {
    if (path === 'stk-push' && req.method === 'POST') {
      return await handleStkPush(req, corsHeaders)
    }
    if (path === 'callback' && req.method === 'POST') {
      return await handleCallback(req, corsHeaders)
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
