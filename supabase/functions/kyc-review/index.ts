import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, submission_id, rejection_reason, reviewer_id } = await req.json()

    if (!['approve', 'reject', 'list_pending'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action', code: 'INVALID_ACTION' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify reviewer is admin/compliance
    const { data: reviewer } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', reviewer_id)
      .single()

    if (!reviewer || !['admin', 'compliance_officer'].includes(reviewer.role)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'list_pending') {
      const { data, error } = await supabaseClient
        .from('kyc_submissions')
        .select(`
          *,
          profiles:user_id (first_name, last_name, email, phone)
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ submissions: data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Approve or Reject
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { data: updated, error } = await supabaseClient
      .from('kyc_submissions')
      .update({
        status: newStatus,
        rejection_reason: action === 'reject' ? rejection_reason : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer_id,
      })
      .eq('id', submission_id)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        submission: updated,
        action,
        message: `KYC submission ${newStatus} successfully`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
