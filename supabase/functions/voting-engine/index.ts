import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { action } = body;

    // 2. SECURITY FIX: Force user context for sensitive actions
    if (action === "create_election" || action === "publish_election" || action === "start_voting" || action === "end_voting" || action === "announce_results") {
      const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== 'admin' && profile?.role !== 'owner') {
        return new Response(JSON.stringify({ error: "Forbidden: Admin or Owner role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Inject authenticated user ID into payload if not provided (prevents spoofing)
    if (action === "register_voter" || action === "cast_vote" || action === "verify_vote") {
      body.user_id = user.id;
    }
    if (action === "create_election" || action === "register_candidate") {
      body.created_by = user.id;
    }

    // ============================================================
    // ELECTION MANAGEMENT
    // ============================================================
    if (action === "create_election") {
      const { data, error } = await supabase
        .from("elections")
        .insert({
          title: body.title,
          description: body.description,
          slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-"),
          election_type: body.election_type,
          jurisdiction_type: body.jurisdiction_type,
          ward_id: body.ward_id,
          constituency_id: body.constituency_id,
          county_id: body.county_id,
          country_code: body.country_code || "KE",
          organization_id: body.organization_id,
          registration_opens_at: body.registration_opens_at,
          registration_closes_at: body.registration_closes_at,
          voting_starts_at: body.voting_starts_at,
          voting_ends_at: body.voting_ends_at,
          voting_method: body.voting_method || "single_choice",
          max_choices: body.max_choices || 1,
          min_choices: body.min_choices || 1,
          minimum_age: body.minimum_age || 18,
          requires_verification: body.requires_verification ?? true,
          eligibility_rules: body.eligibility_rules || {},
          encryption_key_id: body.encryption_key_id,
          audit_trail_enabled: body.audit_trail_enabled ?? true,
          blockchain_verified: body.blockchain_verified ?? false,
          created_by: body.created_by,
          administered_by: body.administered_by || [],
          metadata: body.metadata || {},
          status: "draft"
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // ... (Keep the rest of the voting engine logic as is, it will now use the secured body.user_id)
    if (action === "get_election") {
      const { data, error } = await supabase.from("elections").select("*, candidates:election_candidates(*)").eq("id", body.election_id).single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cast_vote") {
      const { election_id, user_id, profile_id, votes } = body;
      const { data: election, error: eError } = await supabase.from("elections").select("*").eq("id", election_id).single();
      if (eError) throw eError;
      if (election.status !== "voting") throw new Error("Voting is not currently open for this election");
      
      const now = new Date().toISOString();
      if (now < election.voting_starts_at || now > election.voting_ends_at) throw new Error("Voting period is not active");

      const { data: voter, error: vError } = await supabase.from("election_voters").select("*").eq("election_id", election_id).eq("user_id", user_id).single();
      if (vError) throw new Error("Not registered for this election");
      if (!voter.is_verified) throw new Error("Voter not verified");
      if (voter.has_voted) throw new Error("Already voted");

      if (election.voting_method === "single_choice" && votes.length !== 1) throw new Error("Single choice election: must vote for exactly one candidate");
      if (election.voting_method === "multiple_choice" && (votes.length < election.min_choices || votes.length > election.max_choices)) throw new Error(`Must choose between ${election.min_choices} and ${election.max_choices} candidates`);

      const encoder = new TextEncoder();
      const secretSalt = Deno.env.get("VOTE_SECRET_SALT") || "mtaa-voting-salt-2026";
      const hashInput = `${election_id}:${profile_id}:${secretSalt}`;
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(hashInput));
      const voterHash = Array.from(new Uint8Array(hashBuffer)).map((b: any) => b.toString(16).padStart(2, "0")).join("");

      const voteInserts = votes.map((vote: any) => ({
        election_id, voter_hash: voterHash, candidate_id: vote.candidate_id, rank_position: vote.rank_position,
        score: vote.score, is_approved: vote.is_approved, encrypted_vote: vote.encrypted_vote, vote_proof: vote.vote_proof, metadata: vote.metadata || {}
      }));

      const { data: voteData, error: voteError } = await supabase.from("election_votes").insert(voteInserts).select();
      if (voteError) throw voteError;

      await supabase.from("election_voters").update({ has_voted: true, voted_at: new Date().toISOString(), vote_hash: voterHash }).eq("id", voter.id);
      await supabase.rpc("increment_election_vote_count", { p_election_id: election_id });
      await supabase.from("election_audit_log").insert({ election_id, action: "vote_cast", performed_by: profile_id, details: { voter_hash, vote_count: votes.length } });

      return new Response(JSON.stringify({ success: true, data: { votes_cast: voteData.length, voter_hash: voterHash.substring(0, 16) + "..." } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, error: "Unknown action: " + action }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  } catch (error) {
    console.error("Voting engine error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
