// ============================================================
// MTAA SEARCH OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: query, autocomplete, analytics
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let result;
    switch (action) {
      case "query":
        result = await searchQuery(supabaseAdmin, user.id, params);
        break;
      case "autocomplete":
        result = await searchAutocomplete(supabaseAdmin, user.id, params);
        break;
      case "analytics":
        result = await searchAnalytics(supabaseAdmin, user.id, params);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action: " + action }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// ACTION: QUERY
// Full search across modules
// ============================================================
async function searchQuery(supabaseAdmin, userId, params) {
  const { q, module, limit = 20, offset = 0, filters } = params;

  if (!q || q.length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  const searchTerm = `%${q}%`;
  let results = [];
  let total = 0;

  // Search based on module
  switch (module) {
    case "users": {
      const { data: users, count: userCount } = await supabaseAdmin
        .from("user_profiles")
        .select("user_id, display_name, username, avatar_url, bio", { count: "exact" })
        .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .limit(limit)
        .range(offset, offset + limit - 1);
      results = users || [];
      total = userCount || 0;
      break;
    }

    case "content": {
      const { data: content, count: contentCount } = await supabaseAdmin
        .from("content")
        .select("id, title, body, content_type, user_id, created_at", { count: "exact" })
        .or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`)
        .eq("visibility", "public")
        .limit(limit)
        .range(offset, offset + limit - 1);
      results = content || [];
      total = contentCount || 0;
      break;
    }

    case "marketplace": {
      const { data: products, count: productCount } = await supabaseAdmin
        .from("products")
        .select("id, name, description, price, seller_id, category", { count: "exact" })
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("status", "active")
        .limit(limit)
        .range(offset, offset + limit - 1);
      results = products || [];
      total = productCount || 0;
      break;
    }

    case "jobs": {
      const { data: jobs, count: jobCount } = await supabaseAdmin
        .from("jobs")
        .select("id, title, description, employer_id, salary_range, location", { count: "exact" })
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .eq("status", "active")
        .limit(limit)
        .range(offset, offset + limit - 1);
      results = jobs || [];
      total = jobCount || 0;
      break;
    }

    default: {
      // Global search across all public content
      const { data: global } = await supabaseAdmin
        .from("content")
        .select("id, title, body, content_type, user_id, created_at")
        .or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`)
        .eq("visibility", "public")
        .limit(limit);
      results = global || [];
      total = results.length;
    }
  }

  // Log search query
  await supabaseAdmin.from("search_queries").insert({
    user_id: userId,
    query: q,
    module: module || "global",
    result_count: total,
    created_at: new Date().toISOString()
  });

  return {
    success: true,
    query: q,
    module: module || "global",
    results: results,
    total: total,
    limit: limit,
    offset: offset,
    message: `Found ${total} results for "${q}".`
  };
}

// ============================================================
// ACTION: AUTOCOMPLETE
// Search suggestions
// ============================================================
async function searchAutocomplete(supabaseAdmin, userId, params) {
  const { q, module, limit = 10 } = params;

  if (!q || q.length < 1) {
    return { success: true, suggestions: [] };
  }

  const searchTerm = `%${q}%`;
  let suggestions = [];

  // Get suggestions from search history
  const { data: history } = await supabaseAdmin
    .from("search_queries")
    .select("query")
    .ilike("query", searchTerm)
    .order("created_at", { ascending: false })
    .limit(limit);

  suggestions = (history || []).map((h: any) => h.query);

  // If not enough, add from content titles
  if (suggestions.length < limit) {
    const { data: content } = await supabaseAdmin
      .from("content")
      .select("title")
      .ilike("title", searchTerm)
      .eq("visibility", "public")
      .limit(limit - suggestions.length);

    suggestions = [...suggestions, ...(content || []).map((c: any) => c.title)];
  }

  // Deduplicate
  suggestions = [...new Set(suggestions)].slice(0, limit);

  return {
    success: true,
    query: q,
    suggestions: suggestions,
    message: `${suggestions.length} suggestions found.`
  };
}

// ============================================================
// ACTION: ANALYTICS
// Search analytics
// ============================================================
async function searchAnalytics(supabaseAdmin, userId, params) {
  const { period = "today" } = params;

  const now = new Date();
  let start;
  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const { data: queries, count } = await supabaseAdmin
    .from("search_queries")
    .select("query, module, result_count", { count: "exact" })
    .gte("created_at", start.toISOString());

  // Top queries
  const topQueries = {};
  (queries || []).forEach(q => {
    topQueries[q.query] = (topQueries[q.query] || 0) + 1;
  });

  // Top modules
  const byModule = {};
  (queries || []).forEach(q => {
    byModule[q.module] = (byModule[q.module] || 0) + 1;
  });

  return {
    success: true,
    period: period,
    total_searches: count || 0,
    top_queries: Object.entries(topQueries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    by_module: byModule,
    message: `Search analytics for ${period}: ${count || 0} total searches.`
  };
}