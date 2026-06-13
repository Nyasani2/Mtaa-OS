// ============================================================
// MTAA AGENT OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: register, activate, instant_activate, deposit_float, topup_float, 
//          customer_deposit, customer_withdrawal, agent_withdraw, dashboard, 
//          qr_verify, nearby
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
      case "register":
        result = await agentRegister(supabaseAdmin, user.id, params);
        break;
      case "activate":
        result = await agentActivate(supabaseAdmin, user.id, params);
        break;
      case "instant_activate":
        result = await agentInstantActivate(supabaseAdmin, user.id, params);
        break;
      case "deposit_float":
        result = await agentDepositFloat(supabaseAdmin, user.id, params);
        break;
      case "topup_float":
        result = await agentTopupFloat(supabaseAdmin, user.id, params);
        break;
      case "customer_deposit":
        result = await agentCustomerDeposit(supabaseAdmin, user.id, params);
        break;
      case "customer_withdrawal":
        result = await agentCustomerWithdrawal(supabaseAdmin, user.id, params);
        break;
      case "agent_withdraw":
        result = await agentWithdraw(supabaseAdmin, user.id, params);
        break;
      case "dashboard":
        result = await agentDashboard(supabaseAdmin, user.id, params);
        break;
      case "qr_verify":
        result = await agentQrVerify(supabaseAdmin, user.id, params);
        break;
      case "nearby":
        result = await agentNearby(supabaseAdmin, user.id, params);
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
// ACTION: REGISTER
// Register as an agent
// ============================================================
async function agentRegister(supabaseAdmin, userId, params) {
  const { business_name, location, phone, id_number, kra_pin, business_address, location_lat, location_lng, agent_type = "mobile" } = params;

  if (!business_name || !phone || !id_number) {
    throw new Error("Missing required fields: business_name, phone, id_number");
  }

  // Check if already registered
  const { data: existing } = await supabaseAdmin
    .from("agents")
    .select("id, status")
    .eq("user_id", userId)
    .single();

  if (existing) {
    throw new Error(`Agent already registered. Status: ${existing.status}`);
  }

  // Create agent record
  const { data: agent } = await supabaseAdmin
    .from("agents")
    .insert({
      user_id: userId,
      business_name: business_name,
      location: location,
      phone: phone,
      id_number: id_number,
      kra_pin: kra_pin,
      business_address: business_address,
      location_lat: location_lat,
      location_lng: location_lng,
      agent_type: agent_type,
      status: "pending_approval",
      float_balance: 0,
      total_commission_earned: 0,
      daily_transaction_limit: 500000,
      monthly_transaction_limit: 10000000,
      today_deposited: 0,
      today_withdrawn: 0,
      monthly_volume: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    agent: {
      id: agent.id,
      business_name: agent.business_name,
      status: agent.status,
      agent_type: agent.agent_type
    },
    message: `Agent "${business_name}" registered. Pending approval.`
  };
}

// ============================================================
// ACTION: ACTIVATE
// Admin activates an agent
// ============================================================
async function agentActivate(supabaseAdmin, adminId, params) {
  const { agent_id } = params;

  if (!agent_id) {
    throw new Error("Missing agent_id");
  }

  // Verify admin
  const { data: admin } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", adminId)
    .in("role", ["admin", "supervisor"])
    .single();

  if (!admin) {
    throw new Error("Only admins can activate agents");
  }

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .update({
      status: "active",
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      activated_at: new Date().toISOString()
    })
    .eq("id", agent_id)
    .eq("status", "pending_approval")
    .select()
    .single();

  if (!agent) {
    throw new Error("Agent not found or not in pending approval status");
  }

  // Create agent float record
  await supabaseAdmin
    .from("agent_float")
    .insert({
      agent_id: agent.id,
      balance: 0,
      updated_at: new Date().toISOString()
    });

  return {
    success: true,
    agent: {
      id: agent.id,
      status: agent.status,
      activated_at: agent.activated_at
    },
    message: `Agent "${agent.business_name}" activated successfully.`
  };
}

// ============================================================
// ACTION: INSTANT_ACTIVATE
// Auto-activate agent (if criteria met)
// ============================================================
async function agentInstantActivate(supabaseAdmin, userId, params) {
  const { agent_id, auto_approve = false } = params;

  if (!agent_id) {
    throw new Error("Missing agent_id");
  }

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("id", agent_id)
    .single();

  if (!agent) throw new Error("Agent not found");

  // Auto-approve if KYC verified and auto_approve enabled
  if (auto_approve) {
    const { data: kyc } = await supabaseAdmin
      .from("identity_verification")
      .select("verified")
      .eq("user_id", agent.user_id)
      .single();

    if (kyc?.verified) {
      await supabaseAdmin
        .from("agents")
        .update({
          status: "active",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          activated_at: new Date().toISOString()
        })
        .eq("id", agent_id);

      // Create float record
      await supabaseAdmin
        .from("agent_float")
        .insert({
          agent_id: agent.id,
          balance: 0
        });

      return {
        success: true,
        agent_id: agent_id,
        status: "active",
        message: "Agent auto-activated based on verified KYC."
      };
    }
  }

  return {
    success: true,
    agent_id: agent_id,
    status: agent.status,
    message: "Agent requires manual approval."
  };
}

// ============================================================
// ACTION: DEPOSIT_FLOAT
// Agent deposits float (initial/topup)
// ============================================================
async function agentDepositFloat(supabaseAdmin, userId, params) {
  const { agent_id, amount, payment_method = "mpesa" } = params;

  if (!agent_id || !amount || amount <= 0) {
    throw new Error("Missing agent_id or invalid amount");
  }

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*, agent_float(balance)")
    .eq("id", agent_id)
    .eq("user_id", userId)
    .single();

  if (!agent) throw new Error("Agent not found");
  if (agent.status !== "active") {
    throw new Error("Agent must be active to deposit float");
  }

  // Get user wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", userId)
    .eq("wallet_type", "main")
    .single();

  if (!wallet || wallet.available_balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  // Debit wallet
  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: wallet.available_balance - amount })
    .eq("id", wallet.id);

  // Credit float
  const newBalance = (agent.agent_float?.balance || 0) + amount;
  await supabaseAdmin
    .from("agent_float")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("agent_id", agent_id);

  // Update agent
  await supabaseAdmin
    .from("agents")
    .update({ float_balance: newBalance })
    .eq("id", agent_id);

  // Record transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    transaction_type: "agent_float_deposit",
    direction: "debit",
    amount: amount,
    net_amount: -amount,
    status: "completed",
    metadata: { agent_id, payment_method }
  });

  return {
    success: true,
    agent_id: agent_id,
    float_balance: newBalance,
    amount_deposited: amount,
    message: `Float deposit of KES ${amount} successful. New balance: KES ${newBalance}.`
  };
}

// ============================================================
// ACTION: TOPUP_FLOAT
// Agent tops up float
// ============================================================
async function agentTopupFloat(supabaseAdmin, userId, params) {
  // Same as deposit_float
  return await agentDepositFloat(supabaseAdmin, userId, params);
}

// ============================================================
// ACTION: CUSTOMER_DEPOSIT
// Agent accepts customer deposit
// ============================================================
async function agentCustomerDeposit(supabaseAdmin, agentUserId, params) {
  const { customer_id, amount, customer_phone } = params;

  if (!customer_id || !amount || amount <= 0) {
    throw new Error("Missing customer_id or invalid amount");
  }

  // Get agent
  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*, agent_float(balance)")
    .eq("user_id", agentUserId)
    .eq("status", "active")
    .single();

  if (!agent) throw new Error("Agent not found or not active");

  // Check daily limit
  if (agent.today_deposited + amount > agent.daily_transaction_limit) {
    throw new Error("Daily transaction limit exceeded");
  }

  // Credit customer wallet
  const { data: customerWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", customer_id)
    .eq("wallet_type", "main")
    .single();

  if (!customerWallet) throw new Error("Customer wallet not found");

  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: customerWallet.available_balance + amount })
    .eq("id", customerWallet.id);

  // Debit agent float
  const newFloatBalance = (agent.agent_float?.balance || 0) - amount;
  if (newFloatBalance < 0) {
    throw new Error("Insufficient float balance");
  }

  await supabaseAdmin
    .from("agent_float")
    .update({ balance: newFloatBalance, updated_at: new Date().toISOString() })
    .eq("agent_id", agent.id);

  await supabaseAdmin
    .from("agents")
    .update({
      float_balance: newFloatBalance,
      today_deposited: agent.today_deposited + amount,
      monthly_volume: agent.monthly_volume + amount
    })
    .eq("id", agent.id);

  // Calculate commission (0.5%)
  const commission = Math.round(amount * 0.005 * 100) / 100;
  await supabaseAdmin
    .from("agents")
    .update({ total_commission_earned: agent.total_commission_earned + commission })
    .eq("id", agent.id);

  // Record transactions
  await supabaseAdmin.from("wallet_transactions").insert([
    {
      wallet_id: customerWallet.id,
      user_id: customer_id,
      transaction_type: "agent_deposit",
      direction: "credit",
      amount: amount,
      net_amount: amount,
      status: "completed",
      metadata: { agent_id: agent.id, commission }
    }
  ]);

  return {
    success: true,
    customer_id: customer_id,
    amount: amount,
    commission: commission,
    agent_float_balance: newFloatBalance,
    message: `Customer deposit of KES ${amount} processed. Commission: KES ${commission}.`
  };
}

// ============================================================
// ACTION: CUSTOMER_WITHDRAWAL
// Agent processes customer withdrawal
// ============================================================
async function agentCustomerWithdrawal(supabaseAdmin, agentUserId, params) {
  const { customer_id, amount, customer_phone } = params;

  if (!customer_id || !amount || amount <= 0) {
    throw new Error("Missing customer_id or invalid amount");
  }

  // Get agent
  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*, agent_float(balance)")
    .eq("user_id", agentUserId)
    .eq("status", "active")
    .single();

  if (!agent) throw new Error("Agent not found or not active");

  // Check daily limit
  if (agent.today_withdrawn + amount > agent.daily_transaction_limit) {
    throw new Error("Daily transaction limit exceeded");
  }

  // Debit customer wallet
  const { data: customerWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", customer_id)
    .eq("wallet_type", "main")
    .single();

  if (!customerWallet || customerWallet.available_balance < amount) {
    throw new Error("Customer has insufficient balance");
  }

  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: customerWallet.available_balance - amount })
    .eq("id", customerWallet.id);

  // Credit agent float
  const newFloatBalance = (agent.agent_float?.balance || 0) + amount;
  await supabaseAdmin
    .from("agent_float")
    .update({ balance: newFloatBalance, updated_at: new Date().toISOString() })
    .eq("agent_id", agent.id);

  await supabaseAdmin
    .from("agents")
    .update({
      float_balance: newFloatBalance,
      today_withdrawn: agent.today_withdrawn + amount,
      monthly_volume: agent.monthly_volume + amount
    })
    .eq("id", agent.id);

  // Calculate commission (0.5%)
  const commission = Math.round(amount * 0.005 * 100) / 100;
  await supabaseAdmin
    .from("agents")
    .update({ total_commission_earned: agent.total_commission_earned + commission })
    .eq("id", agent.id);

  // Record transactions
  await supabaseAdmin.from("wallet_transactions").insert([
    {
      wallet_id: customerWallet.id,
      user_id: customer_id,
      transaction_type: "agent_withdrawal",
      direction: "debit",
      amount: amount,
      net_amount: -amount,
      status: "completed",
      metadata: { agent_id: agent.id, commission }
    }
  ]);

  return {
    success: true,
    customer_id: customer_id,
    amount: amount,
    commission: commission,
    agent_float_balance: newFloatBalance,
    message: `Customer withdrawal of KES ${amount} processed. Commission: KES ${commission}.`
  };
}

// ============================================================
// ACTION: AGENT_WITHDRAW
// Agent withdraws earnings/float
// ============================================================
async function agentWithdraw(supabaseAdmin, userId, params) {
  const { amount, destination = "wallet" } = params;

  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*, agent_float(balance)")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!agent) throw new Error("Agent not found");

  const floatBalance = agent.agent_float?.balance || 0;
  if (floatBalance < amount) {
    throw new Error(`Insufficient float. Available: KES ${floatBalance}`);
  }

  // Debit float
  const newFloatBalance = floatBalance - amount;
  await supabaseAdmin
    .from("agent_float")
    .update({ balance: newFloatBalance, updated_at: new Date().toISOString() })
    .eq("agent_id", agent.id);

  await supabaseAdmin
    .from("agents")
    .update({ float_balance: newFloatBalance })
    .eq("id", agent.id);

  // Credit agent wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", userId)
    .eq("wallet_type", "main")
    .single();

  if (wallet) {
    await supabaseAdmin
      .from("wallets")
      .update({ available_balance: wallet.available_balance + amount })
      .eq("id", wallet.id);
  }

  return {
    success: true,
    amount: amount,
    float_balance: newFloatBalance,
    message: `Agent withdrawal of KES ${amount} to wallet successful.`
  };
}

// ============================================================
// ACTION: DASHBOARD
// Get agent dashboard data
// ============================================================
async function agentDashboard(supabaseAdmin, userId, params) {
  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("*, agent_float(balance)")
    .eq("user_id", userId)
    .single();

  if (!agent) throw new Error("Agent not found");

  // Get today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayTransactions } = await supabaseAdmin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .in("transaction_type", ["agent_deposit", "agent_withdrawal"]);

  const todayDeposits = (todayTransactions || [])
    .filter(t => t.direction === "credit")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const todayWithdrawals = (todayTransactions || [])
    .filter(t => t.direction === "debit")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    success: true,
    dashboard: {
      agent_id: agent.id,
      status: agent.status,
      business_name: agent.business_name,
      float_balance: agent.agent_float?.balance || 0,
      total_commission: agent.total_commission_earned,
      daily_limit: agent.daily_transaction_limit,
      monthly_limit: agent.monthly_transaction_limit,
      today_deposits: todayDeposits,
      today_withdrawals: todayWithdrawals,
      monthly_volume: agent.monthly_volume,
      location: { lat: agent.location_lat, lng: agent.location_lng }
    },
    message: "Agent dashboard data retrieved."
  };
}

// ============================================================
// ACTION: QR_VERIFY
// Verify agent via QR code
// ============================================================
async function agentQrVerify(supabaseAdmin, userId, params) {
  const { qr_data } = params;

  if (!qr_data) {
    throw new Error("Missing qr_data");
  }

  let parsedData;
  try {
    parsedData = typeof qr_data === "string" ? JSON.parse(qr_data) : qr_data;
  } catch (e) {
    throw new Error("Invalid QR data");
  }

  const { data: agent } = await supabaseAdmin
    .from("agents")
    .select("id, business_name, status, qr_code_data")
    .eq("id", parsedData.agent_id)
    .single();

  if (!agent) throw new Error("Agent not found");
  if (agent.status !== "active") {
    throw new Error("Agent is not active");
  }

  return {
    success: true,
    agent: {
      id: agent.id,
      business_name: agent.business_name,
      status: agent.status,
      verified: true
    },
    message: `Agent "${agent.business_name}" verified successfully.`
  };
}

// ============================================================
// ACTION: NEARBY
// Find nearby agents
// ============================================================
async function agentNearby(supabaseAdmin, userId, params) {
  const { lat, lng, radius_km = 5, agent_type } = params;

  if (!lat || !lng) {
    throw new Error("Missing lat or lng");
  }

  let query = supabaseAdmin
    .from("agents")
    .select("id, business_name, location_lat, location_lng, agent_type, status, phone")
    .eq("status", "active")
    .not("location_lat", "is", null)
    .not("location_lng", "is", null);

  if (agent_type) {
    query = query.eq("agent_type", agent_type);
  }

  const { data: agents } = await query;

  // Filter by distance
  const nearbyAgents = (agents || []).filter(agent => {
    const distance = calculateDistance(lat, lng, agent.location_lat, agent.location_lng);
    return distance <= radius_km;
  }).map(agent => ({
    ...agent,
    distance_km: Math.round(calculateDistance(lat, lng, agent.location_lat, agent.location_lng) * 100) / 100
  })).sort((a, b) => a.distance_km - b.distance_km);

  return {
    success: true,
    agents: nearbyAgents,
    total: nearbyAgents.length,
    radius_km: radius_km,
    message: `${nearbyAgents.length} agent(s) found within ${radius_km}km.`
  };
}

// ============================================================
// HELPER: Calculate distance between two coordinates
// ============================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
