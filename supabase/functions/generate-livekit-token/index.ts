import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@1.2.7";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { roomName, userId, userName, isPublisher } = await req.json();
    
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    const SB_URL = Deno.env.get("SB_URL");
    const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY");

    if (!LIVEKIT_API_KEY || !SB_SERVICE_ROLE_KEY) throw new Error("Missing env vars");

    const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

    const { data: stream, error: streamError } = await supabase
      .from('live_streams').select('*').eq('livekit_room_name', roomName).single();

    if (streamError || !stream) throw new Error("Stream not found");

    // THE BOUNCER: If private or paid, check for a ticket
    if (stream.is_private === true || (stream.price && stream.price > 0)) {
      if (stream.host_id !== userId) {
        const { data: ticket } = await supabase
          .from('live_stream_tickets').select('id')
          .eq('stream_id', stream.id).eq('user_id', userId).eq('status', 'valid').single();

        if (!ticket) {
          return new Response(JSON.stringify({ error: 'Access Denied. Buy a ticket first.' }), 
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: userId, name: userName, ttl: "10m" });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: isPublisher || false, canSubscribe: true });

    return new Response(JSON.stringify({ token: at.toJwt(), url: LIVEKIT_URL }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});