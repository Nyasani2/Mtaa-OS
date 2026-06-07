// Edge Function: wallet-operations
// CONSOLIDATED: Replaces wallet-gofund-campaign + wallet-savings-goal + wallet-partner-submit
// Actions: gofund_list, gofund_get, gofund_create, gofund_contribute,
//          savings_list, savings_create, savings_contribute, savings_get,
//          partner_submit, partner_list

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

    const body = await req.json();
    const { action } = body;

    // ═══════════════════════════════════════════════════════════════
    // GOFUND OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    if (action === 'gofund_list') {
      const { data, error } = await supabaseAdmin
        .from('gofund_campaigns')
        .select(`*, contribution_count:gofund_contributions(count)`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'gofund_get') {
      const { campaign_id } = body;
      const [campaignRes, contribRes, updateRes] = await Promise.all([
        supabaseAdmin.from('gofund_campaigns').select('*').eq('id', campaign_id).single(),
        supabaseAdmin.from('gofund_contributions').select('*').eq('campaign_id', campaign_id).order('created_at', { ascending: false }).limit(50),
        supabaseAdmin.from('gofund_updates').select('*').eq('campaign_id', campaign_id).order('created_at', { ascending: false }),
      ]);

      if (campaignRes.error) throw campaignRes.error;
      return new Response(JSON.stringify({
        campaign: campaignRes.data,
        contributions: contribRes.data || [],
        updates: updateRes.data || [],
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'gofund_create') {
      const { title, description, target_amount, campaign_type, end_date } = body;
      if (!title || !target_amount || !end_date) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('gofund_campaigns')
        .insert({
          title,
          description,
          target_amount,
          current_amount: 0,
          currency_code: 'KES',
          campaign_type,
          end_date,
          creator_id: user.id,
          is_active: true,
          is_completed: false,
          donor_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'gofund_contribute') {
      const { campaign_id, amount } = body;
      if (!campaign_id || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid contribution' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: campaign } = await supabaseAdmin
        .from('gofund_campaigns')
        .select('*')
        .eq('id', campaign_id)
        .single();

      if (!campaign) {
        return new Response(JSON.stringify({ error: 'Campaign not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: contrib, error: contribError } = await supabaseAdmin
        .from('gofund_contributions')
        .insert({
          campaign_id,
          donor_id: user.id,
          donor_name: user.user_metadata?.full_name || 'Anonymous',
          amount,
          currency_code: campaign.currency_code || 'KES',
          is_anonymous: false,
          payment_status: 'completed',
        })
        .select()
        .single();

      if (contribError) throw contribError;

      // Update campaign
      const newAmount = (campaign.current_amount || 0) + amount;
      const updates: any = { current_amount: newAmount, donor_count: (campaign.donor_count || 0) + 1 };
      if (newAmount >= campaign.target_amount && !campaign.is_completed) {
        updates.is_completed = true;
        updates.completed_at = new Date().toISOString();
      }

      await supabaseAdmin.from('gofund_campaigns').update(updates).eq('id', campaign_id);

      return new Response(JSON.stringify({ success: true, contribution: contrib }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // SAVINGS OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    if (action === 'savings_list') {
      const { data, error } = await supabaseAdmin
        .from('wallet_savings')
        .select(`*, contribution_count:wallet_savings_contributions(count)`)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data: data || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'savings_create') {
      const { goal_name, description, target_amount, savings_type, target_date } = body;
      if (!goal_name || !target_amount || !target_date) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('wallet_savings')
        .insert({
          user_id: user.id,
          goal_name,
          description,
          target_amount,
          current_amount: 0,
          currency_code: 'KES',
          savings_type,
          target_date,
          is_active: true,
          is_completed: false,
          total_contributions: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'savings_contribute') {
      const { savings_id, amount } = body;
      if (!savings_id || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid contribution' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: goal } = await supabaseAdmin
        .from('wallet_savings')
        .select('*')
        .eq('id', savings_id)
        .single();

      if (!goal) {
        return new Response(JSON.stringify({ error: 'Goal not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: contrib, error: contribError } = await supabaseAdmin
        .from('wallet_savings_contributions')
        .insert({
          savings_id,
          contributor_id: user.id,
          amount,
          currency_code: goal.currency_code || 'KES',
          status: 'completed',
        })
        .select()
        .single();

      if (contribError) throw contribError;

      const newAmount = (goal.current_amount || 0) + amount;
      const updates: any = { current_amount: newAmount, total_contributions: (goal.total_contributions || 0) + 1 };
      if (newAmount >= goal.target_amount && !goal.is_completed) {
        updates.is_completed = true;
        updates.completed_at = new Date().toISOString();
      }

      await supabaseAdmin.from('wallet_savings').update(updates).eq('id', savings_id);

      return new Response(JSON.stringify({ success: true, contribution: contrib }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'savings_get') {
      const { savings_id } = body;
      const [goalRes, contribRes] = await Promise.all([
        supabaseAdmin.from('wallet_savings').select('*').eq('id', savings_id).single(),
        supabaseAdmin.from('wallet_savings_contributions').select('*').eq('savings_id', savings_id).order('created_at', { ascending: false }).limit(50),
      ]);

      if (goalRes.error) throw goalRes.error;
      return new Response(JSON.stringify({
        goal: goalRes.data,
        contributions: contribRes.data || [],
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTNER OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    if (action === 'partner_submit') {
      const {
        applicant_type,
        organization_name,
        country_code,
        contact_name,
        contact_email,
        contact_phone,
        website,
        partnership_type,
        description,
      } = body;

      if (!organization_name || !contact_email || !contact_phone) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Deduplication check
      const { data: existing } = await supabaseAdmin
        .from('wallet_partner_applications')
        .select('id')
        .eq('organization_name', organization_name)
        .eq('applicant_type', applicant_type)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'Application already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('wallet_partner_applications')
        .insert({
          applicant_type,
          organization_name,
          country_code: country_code || 'KE',
          contact_name,
          contact_email,
          contact_phone,
          website,
          partnership_type,
          proposed_services: body.services_offered || [],
          application_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabaseAdmin.from('wallet_audit_logs').insert({
        table_name: 'wallet_partner_applications',
        record_id: data.id,
        action: 'INSERT',
        changed_by: user.id,
        new_data: { applicant_type, organization_name },
      });

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'partner_list') {
      const { data, error } = await supabaseAdmin
        .from('wallet_partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data: data || [] }), {
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
