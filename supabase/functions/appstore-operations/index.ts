// ============================================================
// MTAA APPSTORE OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: manifest_sync, install, approve, publish, subscribe
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
      case "manifest_sync":
        result = await appstoreManifestSync(supabaseAdmin, user.id, params);
        break;
      case "install":
        result = await appstoreInstall(supabaseAdmin, user.id, params);
        break;
      case "approve":
        result = await appstoreApprove(supabaseAdmin, user.id, params);
        break;
      case "publish":
        result = await appstorePublish(supabaseAdmin, user.id, params);
        break;
      case "subscribe":
        result = await appstoreSubscribe(supabaseAdmin, user.id, params);
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
// ACTION: MANIFEST_SYNC
// Sync app manifest to registry
// ============================================================
async function appstoreManifestSync(supabaseAdmin, userId, params) {
  const { app_id, manifest, version } = params;

  if (!app_id || !manifest) {
    throw new Error("Missing app_id or manifest");
  }

  const { data: app } = await supabaseAdmin
    .from("apps")
    .upsert({
      id: app_id,
      manifest: manifest,
      version: version || "1.0.0",
      updated_by: userId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "id"
    })
    .select()
    .single();

  return {
    success: true,
    app: {
      id: app.id,
      version: app.version,
      updated_at: app.updated_at
    },
    message: `App manifest "${app_id}" synced successfully.`
  };
}

// ============================================================
// ACTION: INSTALL
// Install an app for a user
// ============================================================
async function appstoreInstall(supabaseAdmin, userId, params) {
  const { app_id } = params;

  if (!app_id) {
    throw new Error("Missing app_id");
  }

  // Get app
  const { data: app } = await supabaseAdmin
    .from("apps")
    .select("*")
    .eq("id", app_id)
    .single();

  if (!app) throw new Error("App not found");

  // Check if already installed
  const { data: existing } = await supabaseAdmin
    .from("user_apps")
    .select("id")
    .eq("user_id", userId)
    .eq("app_id", app_id)
    .single();

  if (existing) {
    return {
      success: true,
      installed: true,
      app_id: app_id,
      message: "App already installed."
    };
  }

  // Install app
  const { data: install } = await supabaseAdmin
    .from("user_apps")
    .insert({
      user_id: userId,
      app_id: app_id,
      installed_at: new Date().toISOString(),
      status: "active"
    })
    .select()
    .single();

  return {
    success: true,
    installed: true,
    installation: {
      id: install.id,
      app_id: install.app_id,
      installed_at: install.installed_at
    },
    message: `App "${app.name || app_id}" installed successfully.`
  };
}

// ============================================================
// ACTION: APPROVE
// Admin approves an app
// ============================================================
async function appstoreApprove(supabaseAdmin, adminId, params) {
  const { app_id, approved, reason } = params;

  if (!app_id) {
    throw new Error("Missing app_id");
  }

  // Verify admin
  const { data: admin } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", adminId)
    .in("role", ["admin", "moderator"])
    .single();

  if (!admin) {
    throw new Error("Only admins can approve apps");
  }

  const { data: app } = await supabaseAdmin
    .from("apps")
    .update({
      status: approved ? "approved" : "rejected",
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      rejection_reason: approved ? null : reason
    })
    .eq("id", app_id)
    .select()
    .single();

  return {
    success: true,
    app: {
      id: app.id,
      status: app.status,
      approved_at: app.approved_at
    },
    message: approved ? `App "${app_id}" approved.` : `App "${app_id}" rejected. Reason: ${reason}`
  };
}

// ============================================================
// ACTION: PUBLISH
// Developer publishes an app
// ============================================================
async function appstorePublish(supabaseAdmin, userId, params) {
  const { app_id, name, description, category, price = 0, icon_url, screenshots } = params;

  if (!app_id || !name) {
    throw new Error("Missing app_id or name");
  }

  const { data: app } = await supabaseAdmin
    .from("apps")
    .upsert({
      id: app_id,
      name: name,
      description: description,
      category: category,
      price: price,
      icon_url: icon_url,
      screenshots: screenshots || [],
      developer_id: userId,
      status: "pending_approval",
      published_at: new Date().toISOString()
    }, {
      onConflict: "id"
    })
    .select()
    .single();

  return {
    success: true,
    app: {
      id: app.id,
      name: app.name,
      status: app.status,
      price: app.price
    },
    message: `App "${name}" published. Pending approval.`
  };
}

// ============================================================
// ACTION: SUBSCRIBE
// Subscribe to an app (paid)
// ============================================================
async function appstoreSubscribe(supabaseAdmin, userId, params) {
  const { app_id, plan = "monthly" } = params;

  if (!app_id) {
    throw new Error("Missing app_id");
  }

  // Get app
  const { data: app } = await supabaseAdmin
    .from("apps")
    .select("id, name, price")
    .eq("id", app_id)
    .eq("status", "approved")
    .single();

  if (!app) throw new Error("App not found or not approved");

  const subscriptionPrice = app.price || 0;

  if (subscriptionPrice > 0) {
    // Process payment
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", userId)
      .eq("wallet_type", "main")
      .single();

    if (!wallet || wallet.available_balance < subscriptionPrice) {
      throw new Error(`Insufficient balance. Subscription price: KES ${subscriptionPrice}`);
    }

    // Debit user
    await supabaseAdmin
      .from("wallets")
      .update({ available_balance: wallet.available_balance - subscriptionPrice })
      .eq("id", wallet.id);

    // Credit developer
    const { data: devWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", app.developer_id)
      .eq("wallet_type", "main")
      .single();

    if (devWallet) {
      await supabaseAdmin
        .from("wallets")
        .update({ available_balance: devWallet.available_balance + subscriptionPrice })
        .eq("id", devWallet.id);
    }
  }

  // Create subscription
  const { data: subscription } = await supabaseAdmin
    .from("app_subscriptions")
    .insert({
      user_id: userId,
      app_id: app_id,
      plan: plan,
      price: subscriptionPrice,
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
    .select()
    .single();

  return {
    success: true,
    subscription: {
      id: subscription.id,
      app_id: subscription.app_id,
      plan: subscription.plan,
      expires_at: subscription.expires_at
    },
    message: `Subscribed to "${app.name}" (${plan} plan).`
  };
}
