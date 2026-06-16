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

    const body = await req.json();
    const { action } = body;

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

    if (action === "get_election") {
      const { data, error } = await supabase
        .from("elections")
        .select("*, candidates:election_candidates(*)")
        .eq("id", body.election_id)
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_elections") {
      let query = supabase.from("elections").select("*");
      if (body.election_type) query = query.eq("election_type", body.election_type);
      if (body.status) query = query.eq("status", body.status);
      if (body.county_id) query = query.eq("county_id", body.county_id);
      if (body.constituency_id) query = query.eq("constituency_id", body.constituency_id);
      if (body.ward_id) query = query.eq("ward_id", body.ward_id);
      if (body.organization_id) query = query.eq("organization_id", body.organization_id);
      if (body.jurisdiction_type) query = query.eq("jurisdiction_type", body.jurisdiction_type);

      const { data, error } = await query.order("voting_starts_at", { ascending: false }).limit(body.limit || 50);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_election_status") {
      const { data, error } = await supabase
        .from("elections")
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq("id", body.election_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "publish_election") {
      // Transition from draft to registering
      const { data, error } = await supabase
        .from("elections")
        .update({ 
          status: "registering",
          registration_opens_at: body.registration_opens_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", body.election_id)
        .eq("status", "draft")
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "start_voting") {
      const { data, error } = await supabase
        .from("elections")
        .update({ 
          status: "voting",
          voting_starts_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", body.election_id)
        .eq("status", "registering")
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "end_voting") {
      const { data, error } = await supabase
        .from("elections")
        .update({ 
          status: "counting",
          voting_ends_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", body.election_id)
        .eq("status", "voting")
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // CANDIDATE MANAGEMENT
    // ============================================================
    if (action === "register_candidate") {
      const { data, error } = await supabase
        .from("election_candidates")
        .insert({
          election_id: body.election_id,
          candidate_type: body.candidate_type || "person",
          profile_id: body.profile_id,
          candidate_name: body.candidate_name,
          candidate_bio: body.candidate_bio,
          candidate_photo_url: body.candidate_photo_url,
          party_affiliation: body.party_affiliation,
          party_logo_url: body.party_logo_url,
          project_id: body.project_id,
          option_label: body.option_label,
          option_description: body.option_description,
          ballot_number: body.ballot_number,
          manifesto: body.manifesto,
          campaign_promises: body.campaign_promises || [],
          campaign_media: body.campaign_media || [],
          metadata: body.metadata || {}
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "approve_candidate") {
      const { data, error } = await supabase
        .from("election_candidates")
        .update({ 
          is_approved: true, 
          approved_by: body.approved_by,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", body.candidate_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "disqualify_candidate") {
      const { data, error } = await supabase
        .from("election_candidates")
        .update({ 
          is_disqualified: true,
          disqualification_reason: body.reason,
          disqualified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", body.candidate_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_candidates") {
      const { data, error } = await supabase
        .from("election_candidates")
        .select("*, profile:profiles(id, display_name, avatar_url)")
        .eq("election_id", body.election_id)
        .eq("is_approved", body.approved_only ?? true)
        .eq("is_disqualified", false)
        .order("ballot_number", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // VOTER REGISTRATION
    // ============================================================
    if (action === "register_voter") {
      // Check eligibility
      const { data: election, error: eError } = await supabase
        .from("elections")
        .select("*")
        .eq("id", body.election_id)
        .single();
      if (eError) throw eError;

      if (election.status !== "registering" && election.status !== "voting") {
        throw new Error("Registration is not open for this election");
      }

      // Check if already registered
      const { data: existing } = await supabase
        .from("election_voters")
        .select("*")
        .eq("election_id", body.election_id)
        .eq("user_id", body.user_id)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ success: false, error: "Already registered" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        });
      }

      const { data, error } = await supabase
        .from("election_voters")
        .insert({
          election_id: body.election_id,
          profile_id: body.profile_id,
          user_id: body.user_id,
          is_verified: body.auto_verify ?? false,
          verified_at: body.auto_verify ? new Date().toISOString() : null,
          verification_method: body.auto_verify ? "auto" : "pending",
          eligibility_status: "pending",
          metadata: body.metadata || {}
        })
        .select()
        .single();
      if (error) throw error;

      // Update registered voter count
      await supabase.rpc("increment_election_voter_count", { p_election_id: body.election_id });

      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify_voter") {
      const { data, error } = await supabase
        .from("election_voters")
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: body.verified_by,
          verification_method: body.method || "manual",
          eligibility_status: "eligible",
          updated_at: new Date().toISOString()
        })
        .eq("id", body.voter_id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "check_voter_status") {
      const { data, error } = await supabase
        .from("election_voters")
        .select("*")
        .eq("election_id", body.election_id)
        .eq("user_id", body.user_id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return new Response(JSON.stringify({ success: true, data: data || null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // VOTE CASTING
    // ============================================================
    if (action === "cast_vote") {
      const { election_id, user_id, profile_id, votes } = body;

      // Verify election is open
      const { data: election, error: eError } = await supabase
        .from("elections")
        .select("*")
        .eq("id", election_id)
        .single();
      if (eError) throw eError;

      if (election.status !== "voting") {
        throw new Error("Voting is not currently open for this election");
      }

      const now = new Date().toISOString();
      if (now < election.voting_starts_at || now > election.voting_ends_at) {
        throw new Error("Voting period is not active");
      }

      // Verify voter is registered and verified
      const { data: voter, error: vError } = await supabase
        .from("election_voters")
        .select("*")
        .eq("election_id", election_id)
        .eq("user_id", user_id)
        .single();
      if (vError) throw new Error("Not registered for this election");
      if (!voter.is_verified) throw new Error("Voter not verified");
      if (voter.has_voted) throw new Error("Already voted");

      // Validate vote count
      if (election.voting_method === "single_choice" && votes.length !== 1) {
        throw new Error("Single choice election: must vote for exactly one candidate");
      }
      if (election.voting_method === "multiple_choice" && (votes.length < election.min_choices || votes.length > election.max_choices)) {
        throw new Error(`Must choose between ${election.min_choices} and ${election.max_choices} candidates`);
      }

      // Generate voter hash (anonymous but verifiable)
      const encoder = new TextEncoder();
      const secretSalt = Deno.env.get("VOTE_SECRET_SALT") || "mtaa-voting-salt-2026";
      const hashInput = `${election_id}:${profile_id}:${secretSalt}`;
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(hashInput));
      const voterHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      // Insert votes
      const voteInserts = votes.map((vote: any) => ({
        election_id,
        voter_hash: voterHash,
        candidate_id: vote.candidate_id,
        rank_position: vote.rank_position,
        score: vote.score,
        is_approved: vote.is_approved,
        encrypted_vote: vote.encrypted_vote,
        vote_proof: vote.vote_proof,
        metadata: vote.metadata || {}
      }));

      const { data: voteData, error: voteError } = await supabase
        .from("election_votes")
        .insert(voteInserts)
        .select();
      if (voteError) throw voteError;

      // Mark voter as voted
      await supabase
        .from("election_voters")
        .update({ 
          has_voted: true, 
          voted_at: new Date().toISOString(),
          vote_hash: voterHash
        })
        .eq("id", voter.id);

      // Increment total votes
      await supabase.rpc("increment_election_vote_count", { p_election_id: election_id });

      // Audit log
      await supabase.from("election_audit_log").insert({
        election_id,
        action: "vote_cast",
        performed_by: profile_id,
        details: { voter_hash, vote_count: votes.length }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        data: { 
          votes_cast: voteData.length,
          voter_hash: voterHash.substring(0, 16) + "..." // Partial for verification
        }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // RESULTS & COUNTING
    // ============================================================
    if (action === "get_results") {
      const { election_id } = body;

      const { data: election, error: eError } = await supabase
        .from("elections")
        .select("*")
        .eq("id", election_id)
        .single();
      if (eError) throw eError;

      if (election.status === "voting") {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Voting is still in progress. Results will be available after voting ends."
        }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        });
      }

      // Get vote counts
      const { data: results, error: rError } = await supabase
        .rpc("count_election_votes", { p_election_id: election_id });
      if (rError) throw rError;

      // Get total votes
      const { count: totalVotes } = await supabase
        .from("election_votes")
        .select("*", { count: "exact", head: true })
        .eq("election_id", election_id);

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          election,
          results,
          total_votes_cast: totalVotes,
          total_registered_voters: election.total_registered_voters,
          turnout_percentage: election.total_registered_voters > 0 
            ? ((totalVotes / election.total_registered_voters) * 100).toFixed(2)
            : 0
        }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_ranked_results") {
      const { election_id } = body;

      const { data: results, error } = await supabase
        .rpc("count_ranked_choice_votes", { p_election_id: election_id });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "announce_results") {
      // Admin only: transition to completed and store results
      const { election_id, winner_id, results } = body;

      const { data, error } = await supabase
        .from("elections")
        .update({
          status: "completed",
          winner_id,
          results: results || {},
          results_announced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", election_id)
        .eq("status", "counting")
        .select()
        .single();
      if (error) throw error;

      // Update winner candidate
      if (winner_id) {
        await supabase
          .from("election_candidates")
          .update({ is_winner: true })
          .eq("id", winner_id);
      }

      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // AUDIT & VERIFICATION
    // ============================================================
    if (action === "verify_vote") {
      // Allow voter to verify their vote was counted without revealing choice
      const { election_id, profile_id } = body;

      const encoder = new TextEncoder();
      const secretSalt = Deno.env.get("VOTE_SECRET_SALT") || "mtaa-voting-salt-2026";
      const hashInput = `${election_id}:${profile_id}:${secretSalt}`;
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(hashInput));
      const voterHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: votes, error } = await supabase
        .from("election_votes")
        .select("created_at")
        .eq("election_id", election_id)
        .eq("voter_hash", voterHash);
      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          vote_found: votes.length > 0,
          vote_count: votes.length,
          voted_at: votes[0]?.created_at || null
        }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_audit_log") {
      const { data, error } = await supabase
        .from("election_audit_log")
        .select("*")
        .eq("election_id", body.election_id)
        .order("created_at", { ascending: false })
        .limit(body.limit || 100);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // INCIDENTS
    // ============================================================
    if (action === "report_incident") {
      const { data, error } = await supabase
        .from("election_incidents")
        .insert({
          election_id: body.election_id,
          reported_by: body.reported_by,
          incident_type: body.incident_type,
          description: body.description,
          location: body.location,
          lat: body.lat,
          lng: body.lng,
          evidence_urls: body.evidence_urls || []
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_incidents") {
      const { data, error } = await supabase
        .from("election_incidents")
        .select("*, reporter:profiles(display_name)")
        .eq("election_id", body.election_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // OBSERVERS
    // ============================================================
    if (action === "register_observer") {
      const { data, error } = await supabase
        .from("election_observers")
        .insert({
          election_id: body.election_id,
          profile_id: body.profile_id,
          observer_type: body.observer_type,
          organization_name: body.organization_name,
          accreditation_number: body.accreditation_number
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================================
    // DEFAULT
    // ============================================================
    return new Response(JSON.stringify({ success: false, error: "Unknown action: " + action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });

  } catch (error) {
    console.error("Voting engine error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
