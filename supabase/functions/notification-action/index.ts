/**
 * MTAA AFRIQ — Notification Action Edge Function
 * Handles notification action execution via core/api/
 * Deploy: supabase functions deploy notification-action
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationActionRequest {
  notification_id: string;
  action_id: string;
}

(globalThis as any).Deno?.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      (globalThis as any).Deno?.env?.get('SUPABASE_URL')!,
      (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: NotificationActionRequest = await req.json();
    const { notification_id, action_id } = body;

    // Fetch notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .eq('user_id', user.id)
      .single();

    if (notifError || !notification) {
      return new Response(
        JSON.stringify({ error: 'Notification not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find action
    const actions = notification.actions || [];
    const action = actions.find((a: any) => a.id === action_id);

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute built-in actions
    let result: any = { success: true };

    switch (action_id) {
      case 'dismiss':
        await supabase
          .from('notifications')
          .update({ dismissed_at: new Date().toISOString(), status: 'dismissed' })
          .eq('id', notification_id);
        break;

      case 'mark_read':
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString(), status: 'read' })
          .eq('id', notification_id);
        break;

      case 'archive':
        await supabase
          .from('notifications')
          .update({ archived_at: new Date().toISOString(), status: 'archived' })
          .eq('id', notification_id);
        break;

      default:
        // Custom action — route to core/api/
        if (action.endpoint) {
          const apiBase = (globalThis as any).Deno?.env?.get('API_BASE_URL') || 'https://api.mtaa.afriq/v1';
          const response = await fetch(`${apiBase}${action.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              notification_id,
              action_id,
              user_id: user.id,
              payload: action.payload || {},
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return new Response(
              JSON.stringify({ error: `API error: ${errorText}` }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          result = await response.json();
        } else {
          return new Response(
            JSON.stringify({ error: 'Unknown action and no endpoint defined' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
    }

    // Log action execution
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'notification_action_executed',
      resource_type: 'notification',
      resource_id: notification_id,
      metadata: { action_id, result },
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Notification action error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
