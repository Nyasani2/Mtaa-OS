import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    const now = new Date().toISOString();
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: reminders, error } = await supabase
      .from('calendar_reminders')
      .select(`
        id,
        event_id,
        remind_at,
        method,
        sent,
        calendar_events (title, user_id)
      `)
      .eq('sent', false)
      .lte('remind_at', fiveMinFromNow)
      .gte('remind_at', now);

    if (error) throw error;

    const results = [];
    for (const reminder of reminders || []) {
      await supabase
        .from('calendar_reminders')
        .update({ sent: true, sent_at: now })
        .eq('id', reminder.id);

      results.push({
        reminder_id: reminder.id,
        event_title: reminder.calendar_events?.title,
        user_id: reminder.calendar_events?.user_id,
        method: reminder.method,
        status: 'triggered',
      });
    }

    return new Response(JSON.stringify({ triggered: results.length, reminders: results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
