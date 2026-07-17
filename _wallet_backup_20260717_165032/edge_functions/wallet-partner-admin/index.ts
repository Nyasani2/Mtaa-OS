// Edge Function: wallet-partner-admin
// CONSOLIDATED: Replaces wallet-partner-approve + wallet-partner-reject
// Actions: partner_approve, partner_reject

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // APPROVE
    if (action === 'partner_approve') {
      const { application_id, commission_rate, notes } = body;

      if (!application_id) {
        return new Response(JSON.stringify({ error: 'Missing application_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: appData, error: appError } = await supabaseAdmin
        .from('wallet_partner_applications')
        .select('*')
        .eq('id', application_id)
        .single();

      if (appError || !appData) {
        return new Response(JSON.stringify({ error: 'Application not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update application
      await supabaseAdmin
        .from('wallet_partner_applications')
        .update({
          application_status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
          contract_signed: true,
          activated_at: new Date().toISOString(),
        })
        .eq('id', application_id);

      // Audit log
      await supabaseAdmin.from('wallet_audit_logs').insert({
        table_name: 'wallet_partner_applications',
        record_id: application_id,
        action: 'APPROVE',
        changed_by: user.id,
        new_data: { organization_name: appData.organization_name, commission_rate },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // REJECT
    if (action === 'partner_reject') {
      const { application_id, reason } = body;

      if (!application_id || !reason) {
        return new Response(JSON.stringify({ error: 'Missing application_id or reason' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('wallet_partner_applications')
        .update({
          application_status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
        })
        .eq('id', application_id)
        .select()
        .single();

      if (error) throw error;

      await supabaseAdmin.from('wallet_audit_logs').insert({
        table_name: 'wallet_partner_applications',
        record_id: application_id,
        action: 'REJECT',
        changed_by: user.id,
        new_data: { reason, organization_name: data.organization_name },
      });

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action: ' + action }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
