// governance-operations.ts
// MTAA OS V10 — Kenya Governance & Voting Engine V2
// ALIGNED TO MTAA ACCOUNT SYSTEM
// All governance users are standard MTAA profiles. ASIS handles onboarding.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;

    // Auth
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userRole = "citizen";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, governance_role")
          .eq("id", user.id)
          .single();
        userRole = profile?.governance_role || profile?.role || "citizen";
      }
    }

    const requireAuth = () => { if (!userId) throw new Error("Authentication required"); };
    const requireRole = (roles: string[]) => {
      requireAuth();
      if (!roles.includes(userRole)) throw new Error(`Requires role: ${roles.join(" or ")}`);
    };

    // ============================================================
    // ROLE ASSIGNMENT (The core — replaces "create member")
    // ============================================================

    if (action === "assign_governance_role") {
      requireRole(["admin", "speaker", "county_clerk", "governor", "county_secretary"]);
      const { user_id, role, level, constituency_id, ward_id, county_id, committee_id, term_start, term_end, assignment_reason } = body;

      // 1. Verify user exists in profiles
      const { data: targetUser } = await supabase.from("profiles").select("id").eq("id", user_id).single();
      if (!targetUser) throw new Error("User not found. They must register via MTAA first.");

      // 2. Create role assignment record
      const { data: assignment, error: assignError } = await supabase
        .from("governance_role_assignments")
        .insert({
          user_id,
          role,
          level,
          constituency_id,
          ward_id,
          county_id,
          committee_id,
          assigned_by: userId,
          assigned_by_role: userRole,
          assignment_reason,
          term_start,
          term_end,
          status: "active",
        })
        .select()
        .single();
      if (assignError) throw assignError;

      // 3. Update profile with governance fields
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          governance_role: role,
          governance_level: level,
          constituency_id,
          ward_id,
          county_id,
          is_governance_active: true,
          term_start,
          term_end,
        })
        .eq("id", user_id);
      if (profileError) throw profileError;

      // 4. Trigger ASIS onboarding
      const onboardingType = `${role}_onboarding`.replace(/-/g, "_");
      const { data: onboarding, error: onboardError } = await supabase
        .from("governance_onboarding")
        .insert({
          user_id,
          role_assignment_id: assignment.id,
          onboarding_type: onboardingType,
          total_steps: 6,
          status: "pending",
          assigned_asis_agent: "asis-governance-v1",
        })
        .select()
        .single();
      if (onboardError) throw onboardError;

      // 5. Log audit
      await supabase.from("governance_audit_log").insert({
        entity_type: "governance_role_assignment",
        entity_id: assignment.id,
        action: "role_assigned",
        performed_by: userId,
        performed_by_role: userRole,
        new_values: { user_id, role, level, assigned_by: userId },
      });

      return new Response(JSON.stringify({
        success: true,
        data: { assignment, onboarding },
        message: `Role ${role} assigned. ASIS onboarding triggered.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    // Revoke role
    if (action === "revoke_governance_role") {
      requireRole(["admin", "speaker", "county_clerk", "governor"]);
      const { assignment_id, reason } = body;

      const { data: assignment } = await supabase
        .from("governance_role_assignments")
        .select("user_id, role")
        .eq("id", assignment_id)
        .single();
      if (!assignment) throw new Error("Assignment not found");

      // Update assignment
      await supabase.from("governance_role_assignments")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", assignment_id);

      // Deactivate profile governance
      await supabase.from("profiles")
        .update({ is_governance_active: false, governance_role: null, governance_level: null })
        .eq("id", assignment.user_id);

      // Log
      await supabase.from("governance_audit_log").insert({
        entity_type: "governance_role_assignment",
        entity_id: assignment_id,
        action: "role_revoked",
        performed_by: userId,
        performed_by_role: userRole,
        old_values: { role: assignment.role },
        new_values: { status: "revoked", reason },
      });

      return new Response(JSON.stringify({ success: true, message: "Role revoked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Get active governance members
    if (action === "get_governance_members") {
      const { role, level, county_id, ward_id, constituency_id, limit = 50, offset = 0 } = body;
      let query = supabase.from("active_governance_members").select("*", { count: "exact" });
      if (role) query = query.eq("governance_role", role);
      if (level) query = query.eq("governance_level", level);
      if (county_id) query = query.eq("county_id", county_id);
      if (ward_id) query = query.eq("ward_id", ward_id);
      if (constituency_id) query = query.eq("constituency_id", constituency_id);
      query = query.order("full_name").range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // Get role assignments history
    if (action === "get_role_assignments") {
      const { user_id, status, limit = 50 } = body;
      let query = supabase.from("governance_role_assignments").select("*, profiles!governance_role_assignments_user_id_fkey(full_name)");
      if (user_id) query = query.eq("user_id", user_id);
      if (status) query = query.eq("status", status);
      query = query.order("created_at", { ascending: false }).limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // ASIS ONBOARDING OPERATIONS
    // ============================================================

    if (action === "get_onboarding_status") {
      requireAuth();
      const { onboarding_id, user_id: targetUser } = body;
      let query = supabase.from("governance_onboarding").select("*");
      if (onboarding_id) query = query.eq("id", onboarding_id);
      else if (targetUser) query = query.eq("user_id", targetUser);
      else query = query.eq("user_id", userId);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "update_onboarding_progress") {
      requireAuth();
      const { onboarding_id, step_completed, progress_percent, notes } = body;
      const { data: onboarding } = await supabase.from("governance_onboarding").select("*").eq("id", onboarding_id).single();
      if (!onboarding) throw new Error("Onboarding not found");

      const steps = [...(onboarding.steps_completed || []), step_completed];
      const isComplete = progress_percent >= 100;

      const { data, error } = await supabase
        .from("governance_onboarding")
        .update({
          steps_completed: steps,
          progress_percent,
          status: isComplete ? "completed" : "in_progress",
          completed_at: isComplete ? new Date().toISOString() : null,
          notes: onboarding.notes ? `${onboarding.notes}\n${notes}` : notes,
        })
        .eq("id", onboarding_id)
        .select()
        .single();
      if (error) throw error;

      // If complete, update role assignment
      if (isComplete) {
        await supabase.from("governance_role_assignments")
          .update({ asis_onboarded: true, asis_onboarding_completed_at: new Date().toISOString() })
          .eq("id", onboarding.role_assignment_id);
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // PARLIAMENT SESSIONS
    // ============================================================

    if (action === "create_parliament_session") {
      requireRole(["admin", "clerk", "speaker"]);
      const { data, error } = await supabase.from("parliament_sessions").insert(body.session).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_parliament_sessions") {
      const { session_type, status, limit = 50, offset = 0 } = body;
      let query = supabase.from("parliament_sessions").select("*", { count: "exact" });
      if (session_type) query = query.eq("session_type", session_type);
      if (status) query = query.eq("status", status);
      query = query.order("start_date", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // COUNTY ASSEMBLY
    // ============================================================

    if (action === "create_county_assembly") {
      requireRole(["admin", "county_clerk"]);
      const { data, error } = await supabase.from("county_assemblies").insert(body.assembly).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_county_assemblies") {
      const { county_id, status } = body;
      let query = supabase.from("county_assemblies").select("*");
      if (county_id) query = query.eq("county_id", county_id);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // COUNTY COMMITTEES
    // ============================================================

    if (action === "create_committee") {
      requireRole(["admin", "county_clerk", "speaker"]);
      const { data, error } = await supabase.from("county_committees").insert(body.committee).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_committees") {
      const { county_assembly_id, sector, status } = body;
      let query = supabase.from("county_committees").select("*");
      if (county_assembly_id) query = query.eq("county_assembly_id", county_assembly_id);
      if (sector) query = query.eq("sector", sector);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "add_committee_member") {
      requireRole(["admin", "county_clerk", "speaker", "committee_chair"]);
      const { committee_id, member_id } = body;
      const { data: committee } = await supabase.from("county_committees").select("member_ids").eq("id", committee_id).single();
      const members = [...(committee?.member_ids || []), member_id];
      const { data, error } = await supabase.from("county_committees").update({ member_ids: members }).eq("id", committee_id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // VOTING ENGINE
    // ============================================================

    if (action === "create_voting_session") {
      requireRole(["admin", "clerk", "speaker", "majority_leader", "mca", "committee_chair"]);
      const { data, error } = await supabase.from("voting_sessions").insert(body.session).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_voting_sessions") {
      const { level, county_id, ward_id, status, session_type, limit = 50, offset = 0 } = body;
      let query = supabase.from("voting_sessions").select("*", { count: "exact" });
      if (level) query = query.eq("level", level);
      if (county_id) query = query.eq("county_id", county_id);
      if (ward_id) query = query.eq("ward_id", ward_id);
      if (status) query = query.eq("status", status);
      if (session_type) query = query.eq("session_type", session_type);
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "cast_vote") {
      requireAuth();
      const { voting_session_id, vote, vote_reason } = body;
      const { data: session } = await supabase.from("voting_sessions").select("status, quorum_required").eq("id", voting_session_id).single();
      if (!session) throw new Error("Session not found");
      if (session.status !== "third_reading" && session.status !== "committee_stage") {
        throw new Error("Voting not open");
      }
      const { data: existing } = await supabase.from("votes").select("id").eq("voting_session_id", voting_session_id).eq("voter_id", userId).single();
      if (existing) throw new Error("Already voted");

      const { data: profile } = await supabase.from("profiles").select("governance_role").eq("id", userId).single();
      const voterRole = profile?.governance_role || "public_citizen";

      const { data, error } = await supabase.from("votes").insert({
        voting_session_id, voter_id: userId, voter_role: voterRole, vote, vote_reason,
        is_verified: true, verification_method: "digital_certificate",
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_voting_results") {
      const { voting_session_id } = body;
      const { data: session } = await supabase.from("voting_sessions").select("*").eq("id", voting_session_id).single();
      const { data: votes } = await supabase.from("votes").select("vote, voter_role, vote_timestamp, profiles(full_name)").eq("voting_session_id", voting_session_id);
      return new Response(JSON.stringify({ success: true, session, votes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // PUBLIC PARTICIPATION
    // ============================================================

    if (action === "submit_public_participation") {
      requireAuth();
      const { data, error } = await supabase.from("public_participation").insert({ ...body.participation, citizen_id: userId }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_public_participation") {
      const { voting_session_id, county_id, ward_id, limit = 50, offset = 0 } = body;
      let query = supabase.from("public_participation").select("*, profiles(full_name, avatar_url)", { count: "exact" });
      if (voting_session_id) query = query.eq("voting_session_id", voting_session_id);
      if (county_id) query = query.eq("county_id", county_id);
      if (ward_id) query = query.eq("ward_id", ward_id);
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // REAL-TIME COUNTY FORUMS
    // ============================================================

    if (action === "create_forum") {
      requireRole(["admin", "county_clerk", "speaker", "moderator"]);
      const { data, error } = await supabase.from("county_public_forums").insert(body.forum).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_forums") {
      const { county_id, ward_id, status, scheduled_after, limit = 50, offset = 0 } = body;
      let query = supabase.from("county_public_forums").select("*", { count: "exact" });
      if (county_id) query = query.eq("county_id", county_id);
      if (ward_id) query = query.eq("ward_id", ward_id);
      if (status) query = query.eq("status", status);
      if (scheduled_after) query = query.gte("scheduled_date", scheduled_after);
      query = query.order("scheduled_date", { ascending: true }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "submit_forum_question") {
      requireAuth();
      const { data, error } = await supabase.from("forum_questions").insert({ ...body.question, citizen_id: userId }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_forum_questions") {
      const { forum_id, status, limit = 100 } = body;
      let query = supabase.from("forum_questions").select("*, profiles(full_name, avatar_url)").eq("forum_id", forum_id);
      if (status) query = query.eq("status", status);
      query = query.order("upvotes", { ascending: false }).limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "answer_forum_question") {
      requireRole(["admin", "county_clerk", "speaker", "moderator", "mca", "cec"]);
      const { question_id, answer } = body;
      const { data, error } = await supabase.from("forum_questions").update({
        answer, answered_by: userId, answered_at: new Date().toISOString(), status: "answered",
      }).eq("id", question_id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "create_forum_poll") {
      requireRole(["admin", "county_clerk", "speaker", "moderator"]);
      const { data, error } = await supabase.from("forum_polls").insert(body.poll).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "vote_forum_poll") {
      requireAuth();
      const { poll_id, selected_options, rating, open_response } = body;
      const { data: existing } = await supabase.from("forum_poll_votes").select("id").eq("poll_id", poll_id).eq("citizen_id", userId).single();
      if (existing) throw new Error("Already voted");
      const { data, error } = await supabase.from("forum_poll_votes").insert({
        poll_id, citizen_id: userId, selected_options, rating, open_response,
      }).select().single();
      if (error) throw error;
      // Update poll results
      const { data: poll } = await supabase.from("forum_polls").select("options, total_votes").eq("id", poll_id).single();
      if (poll) {
        const updated = poll.options.map((opt: any) => selected_options.includes(opt.id) ? { ...opt, votes: (opt.votes || 0) + 1 } : opt);
        await supabase.from("forum_polls").update({ options: updated, total_votes: (poll.total_votes || 0) + 1 }).eq("id", poll_id);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_forum_poll_results") {
      const { poll_id } = body;
      const { data: poll } = await supabase.from("forum_polls").select("*").eq("id", poll_id).single();
      const { data: votes } = await supabase.from("forum_poll_votes").select("*").eq("poll_id", poll_id);
      return new Response(JSON.stringify({ success: true, poll, votes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // NATIONAL PUBLIC PARTICIPATION (Article 118)
    // ============================================================

    if (action === "submit_national_participation") {
      requireAuth();
      const { data, error } = await supabase.from("national_public_participation").insert({ ...body.participation, citizen_id: userId }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_national_participation") {
      const { bill_number, topic, status, limit = 50, offset = 0 } = body;
      let query = supabase.from("national_public_participation").select("*, profiles(full_name, avatar_url)", { count: "exact" });
      if (bill_number) query = query.eq("bill_number", bill_number);
      if (topic) query = query.eq("topic", topic);
      if (status) query = query.eq("status", status);
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // PETITIONS
    // ============================================================

    if (action === "create_petition") {
      requireAuth();
      const { data, error } = await supabase.from("petitions").insert({ ...body.petition, petitioner_id: userId }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_petitions") {
      const { level, county_id, ward_id, status, category, limit = 50, offset = 0 } = body;
      let query = supabase.from("petitions").select("*, petitioner:profiles!petitions_petitioner_id_fkey(full_name, avatar_url)", { count: "exact" });
      if (level) query = query.eq("level", level);
      if (county_id) query = query.eq("county_id", county_id);
      if (ward_id) query = query.eq("ward_id", ward_id);
      if (status) query = query.eq("status", status);
      if (category) query = query.eq("category", category);
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "sign_petition") {
      requireAuth();
      const { petition_id, signature_comment } = body;
      const { data, error } = await supabase.from("petition_signatures").insert({
        petition_id, citizen_id: userId, signature_comment, is_verified: true, verification_method: "id_verified",
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // BUDGET & CFB
    // ============================================================

    if (action === "create_county_budget") {
      requireRole(["admin", "county_clerk", "cec", "county_secretary"]);
      const { data, error } = await supabase.from("county_budgets").insert(body.budget).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_county_budgets") {
      const { county_id, fiscal_year, status } = body;
      let query = supabase.from("county_budgets").select("*");
      if (county_id) query = query.eq("county_id", county_id);
      if (fiscal_year) query = query.eq("fiscal_year", fiscal_year);
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "create_cfb") {
      requireRole(["admin", "county_clerk", "mca", "speaker"]);
      const { data, error } = await supabase.from("county_finance_bills").insert(body.cfb).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_cfbs") {
      const { county_id, status, fiscal_year } = body;
      let query = supabase.from("county_finance_bills").select("*");
      if (county_id) query = query.eq("county_id", county_id);
      if (status) query = query.eq("status", status);
      if (fiscal_year) query = query.eq("fiscal_year", fiscal_year);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // WARD PROJECTS
    // ============================================================

    if (action === "create_ward_project") {
      requireRole(["admin", "mca", "ward_admin"]);
      const { data, error } = await supabase.from("ward_projects").insert(body.project).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_ward_projects") {
      const { ward_id, county_id, status, project_type, limit = 50, offset = 0 } = body;
      let query = supabase.from("ward_projects").select("*", { count: "exact" });
      if (ward_id) query = query.eq("ward_id", ward_id);
      if (county_id) query = query.eq("county_id", county_id);
      if (status) query = query.eq("status", status);
      if (project_type) query = query.eq("project_type", project_type);
      query = query.order("community_votes", { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "vote_ward_project") {
      requireAuth();
      const { project_id, vote_type, priority_rank, vote_reason } = body;
      const { data: existing } = await supabase.from("ward_project_votes").select("id").eq("project_id", project_id).eq("citizen_id", userId).eq("vote_type", vote_type).single();
      if (existing) throw new Error(`Already cast ${vote_type} vote`);
      const { data, error } = await supabase.from("ward_project_votes").insert({
        project_id, citizen_id: userId, vote_type, priority_rank, vote_reason,
      }).select().single();
      if (error) throw error;
      const { data: project } = await supabase.from("ward_projects").select("community_votes").eq("id", project_id).single();
      if (project) await supabase.from("ward_projects").update({ community_votes: (project.community_votes || 0) + 1 }).eq("id", project_id);
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // REPORTING & ANALYTICS
    // ============================================================

    if (action === "get_voting_summary") {
      const { voting_session_id } = body;
      let query = supabase.from("voting_results_summary").select("*");
      if (voting_session_id) query = query.eq("voting_session_id", voting_session_id);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_participation_by_county") {
      const { county_id } = body;
      let query = supabase.from("public_participation_by_county").select("*");
      if (county_id) query = query.eq("county_id", county_id);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_ward_rankings") {
      const { ward_id, county_id } = body;
      let query = supabase.from("ward_project_rankings").select("*");
      if (ward_id) query = query.eq("ward_id", ward_id);
      if (county_id) query = query.eq("county_id", county_id);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // AUDIT LOG
    // ============================================================

    if (action === "log_governance_action") {
      requireAuth();
      const { data, error } = await supabase.from("governance_audit_log").insert({ ...body.log, performed_by: userId }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    if (action === "get_audit_log") {
      const { entity_type, entity_id, limit = 100 } = body;
      let query = supabase.from("governance_audit_log").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(limit);
      if (entity_type) query = query.eq("entity_type", entity_type);
      if (entity_id) query = query.eq("entity_id", entity_id);
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // ============================================================
    // UNKNOWN
    // ============================================================
    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
