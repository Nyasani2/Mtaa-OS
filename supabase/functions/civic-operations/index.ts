// ============================================================
// MTAA CIVIC OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: audit_log, notification_route, court_to_prison, police_to_court, jurisdiction_check,
//          generate_taxpayer_id, generate_voucher, process_tax_payment, calculate_tax,
//          process_expenditure, consolidate_revenue
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
      case "audit_log":
        result = await civicAuditLog(supabaseAdmin, user.id, params);
        break;
      case "notification_route":
        result = await civicNotificationRoute(supabaseAdmin, user.id, params);
        break;
      case "court_to_prison":
        result = await civicCourtToPrison(supabaseAdmin, user.id, params);
        break;
      case "police_to_court":
        result = await civicPoliceToCourt(supabaseAdmin, user.id, params);
        break;
      case "jurisdiction_check":
        result = await civicJurisdictionCheck(supabaseAdmin, user.id, params);
        break;
      case "generate_taxpayer_id":
        result = await civicGenerateTaxpayerId(supabaseAdmin, user.id, params);
        break;
      case "generate_voucher":
        result = await civicGenerateVoucher(supabaseAdmin, user.id, params);
        break;
      case "process_tax_payment":
        result = await civicProcessTaxPayment(supabaseAdmin, user.id, params);
        break;
      case "calculate_tax":
        result = await civicCalculateTax(supabaseAdmin, user.id, params);
        break;
      case "process_expenditure":
        result = await civicProcessExpenditure(supabaseAdmin, user.id, params);
        break;
      case "consolidate_revenue":
        result = await civicConsolidateRevenue(supabaseAdmin, user.id, params);
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
// ACTION: AUDIT_LOG
// Log civic system audit event
// ============================================================
async function civicAuditLog(supabaseAdmin, userId, params) {
  const { entity_type, entity_id, action_type, details, module } = params;

  if (!entity_type || !action_type) {
    throw new Error("Missing entity_type or action_type");
  }

  const { data: log } = await supabaseAdmin
    .from("civic_audit_logs")
    .insert({
      entity_type: entity_type,
      entity_id: entity_id,
      action_type: action_type,
      performed_by: userId,
      details: details || {},
      module: module || "general",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    log_id: log.id,
    message: "Audit log entry created."
  };
}

// ============================================================
// ACTION: NOTIFICATION_ROUTE
// Route civic notifications to appropriate recipients
// ============================================================
async function civicNotificationRoute(supabaseAdmin, userId, params) {
  const { notification_type, target_users, data, priority = "normal" } = params;

  if (!notification_type || !target_users || !Array.isArray(target_users)) {
    throw new Error("Missing notification_type or target_users");
  }

  const notifications = target_users.map(targetId => ({
    user_id: targetId,
    actor_id: userId,
    type: notification_type,
    metadata: data || {},
    priority: priority,
    is_read: false,
    created_at: new Date().toISOString()
  }));

  const { data: created } = await supabaseAdmin
    .from("notifications")
    .insert(notifications)
    .select();

  return {
    success: true,
    notifications_sent: created?.length || 0,
    message: `${created?.length || 0} notification(s) routed successfully.`
  };
}

// ============================================================
// ACTION: COURT_TO_PRISON
// Handoff case from court to prison
// ============================================================
async function civicCourtToPrison(supabaseAdmin, userId, params) {
  const { case_id, prisoner_id, prison_id, sentence_details, transfer_date } = params;

  if (!case_id || !prisoner_id || !prison_id) {
    throw new Error("Missing case_id, prisoner_id, or prison_id");
  }

  // Verify court staff
  const { data: staff } = await supabaseAdmin
    .from("civic_staff")
    .select("role, department")
    .eq("user_id", userId)
    .eq("department", "courts")
    .single();

  if (!staff) {
    throw new Error("Only court staff can initiate prison handoff");
  }

  // Create prison record
  const { data: prisonRecord } = await supabaseAdmin
    .from("civic_prisoners")
    .insert({
      case_id: case_id,
      prisoner_id: prisoner_id,
      prison_id: prison_id,
      sentence_details: sentence_details,
      transfer_date: transfer_date || new Date().toISOString(),
      status: "incarcerated",
      transferred_by: userId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Update case status
  await supabaseAdmin
    .from("civic_cases")
    .update({
      status: "sentenced",
      prison_id: prison_id,
      updated_at: new Date().toISOString()
    })
    .eq("id", case_id);

  // Log audit
  await civicAuditLog(supabaseAdmin, userId, {
    entity_type: "case",
    entity_id: case_id,
    action_type: "court_to_prison_handoff",
    details: { prisoner_id, prison_id, prison_record_id: prisonRecord.id },
    module: "courts"
  });

  return {
    success: true,
    prison_record: {
      id: prisonRecord.id,
      case_id: prisonRecord.case_id,
      status: prisonRecord.status
    },
    message: "Case handed off to prison successfully."
  };
}

// ============================================================
// ACTION: POLICE_TO_COURT
// Handoff case from police to court
// ============================================================
async function civicPoliceToCourt(supabaseAdmin, userId, params) {
  const { case_id, court_id, charges, evidence_files, hearing_date } = params;

  if (!case_id || !court_id) {
    throw new Error("Missing case_id or court_id");
  }

  // Verify police staff
  const { data: staff } = await supabaseAdmin
    .from("civic_staff")
    .select("role, department")
    .eq("user_id", userId)
    .eq("department", "police")
    .single();

  if (!staff) {
    throw new Error("Only police staff can initiate court handoff");
  }

  // Update case
  const { data: updatedCase } = await supabaseAdmin
    .from("civic_cases")
    .update({
      status: "arraigned",
      court_id: court_id,
      charges: charges,
      evidence_files: evidence_files || [],
      hearing_date: hearing_date,
      police_handoff_by: userId,
      police_handoff_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", case_id)
    .select()
    .single();

  // Create court docket entry
  await supabaseAdmin
    .from("civic_court_dockets")
    .insert({
      case_id: case_id,
      court_id: court_id,
      entry_type: "arraignment",
      description: "Case transferred from police",
      entered_by: userId,
      created_at: new Date().toISOString()
    });

  // Log audit
  await civicAuditLog(supabaseAdmin, userId, {
    entity_type: "case",
    entity_id: case_id,
    action_type: "police_to_court_handoff",
    details: { court_id, charges },
    module: "police"
  });

  return {
    success: true,
    case: {
      id: updatedCase.id,
      status: updatedCase.status,
      court_id: updatedCase.court_id
    },
    message: "Case handed off to court successfully."
  };
}

// ============================================================
// ACTION: JURISDICTION_CHECK
// Check jurisdiction for a case
// ============================================================
async function civicJurisdictionCheck(supabaseAdmin, userId, params) {
  const { case_type, location_lat, location_lng, offense_severity } = params;

  if (!case_type) {
    throw new Error("Missing case_type");
  }

  // Determine jurisdiction based on case type and location
  let jurisdiction = {
    level: "local",
    court_type: "magistrate",
    applicable_laws: [],
    responsible_department: "police"
  };

  if (offense_severity === "federal" || offense_severity === "national") {
    jurisdiction.level = "federal";
    jurisdiction.court_type = "high_court";
    jurisdiction.responsible_department = "federal_police";
  } else if (offense_severity === "serious") {
    jurisdiction.level = "county";
    jurisdiction.court_type = "county_court";
  }

  // Get applicable courts
  const { data: courts } = await supabaseAdmin
    .from("civic_courts")
    .select("id, name, court_type, jurisdiction_area")
    .eq("court_type", jurisdiction.court_type)
    .eq("is_active", true);

  return {
    success: true,
    jurisdiction: jurisdiction,
    applicable_courts: courts || [],
    message: `Jurisdiction determined: ${jurisdiction.level} level, ${jurisdiction.court_type} court.`
  };
}

// ============================================================
// ACTION: GENERATE_TAXPAYER_ID
// Generate unique taxpayer identification number
// ============================================================
async function civicGenerateTaxpayerId(supabaseAdmin, userId, params) {
  const { citizen_id, business_id, id_type = "individual" } = params;

  const targetId = citizen_id || business_id || userId;

  // Check if already has taxpayer ID
  const { data: existing } = await supabaseAdmin
    .from("civic_taxpayers")
    .select("taxpayer_id")
    .eq("entity_id", targetId)
    .single();

  if (existing) {
    return {
      success: true,
      taxpayer_id: existing.taxpayer_id,
      message: "Taxpayer ID already exists."
    };
  }

  // Generate unique ID
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  const taxpayerId = `TAX-${year}-${random}`;

  const { data: taxpayer } = await supabaseAdmin
    .from("civic_taxpayers")
    .insert({
      taxpayer_id: taxpayerId,
      entity_id: targetId,
      entity_type: id_type,
      registered_by: userId,
      status: "active",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    taxpayer_id: taxpayer.taxpayer_id,
    entity_id: taxpayer.entity_id,
    message: `Taxpayer ID ${taxpayerId} generated successfully.`
  };
}

// ============================================================
// ACTION: GENERATE_VOUCHER
// Generate payment voucher
// ============================================================
async function civicGenerateVoucher(supabaseAdmin, userId, params) {
  const { amount, purpose, payee_id, payee_name, budget_line_id } = params;

  if (!amount || !purpose) {
    throw new Error("Missing amount or purpose");
  }

  const voucherId = `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const { data: voucher } = await supabaseAdmin
    .from("civic_vouchers")
    .insert({
      voucher_id: voucherId,
      amount: amount,
      purpose: purpose,
      payee_id: payee_id,
      payee_name: payee_name,
      budget_line_id: budget_line_id,
      generated_by: userId,
      status: "pending_approval",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    voucher: {
      id: voucher.id,
      voucher_id: voucher.voucher_id,
      amount: voucher.amount,
      status: voucher.status
    },
    message: `Voucher ${voucherId} generated. Pending approval.`
  };
}

// ============================================================
// ACTION: PROCESS_TAX_PAYMENT
// Process tax payment
// ============================================================
async function civicProcessTaxPayment(supabaseAdmin, userId, params) {
  const { taxpayer_id, tax_type, amount, assessment_period, payment_method = "wallet" } = params;

  if (!taxpayer_id || !tax_type || !amount) {
    throw new Error("Missing taxpayer_id, tax_type, or amount");
  }

  // Verify taxpayer
  const { data: taxpayer } = await supabaseAdmin
    .from("civic_taxpayers")
    .select("*")
    .eq("taxpayer_id", taxpayer_id)
    .single();

  if (!taxpayer) throw new Error("Taxpayer not found");

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

  // Process payment
  const transactionRef = `TAX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Debit taxpayer
  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: wallet.available_balance - amount })
    .eq("id", wallet.id);

  // Record tax payment
  const { data: payment } = await supabaseAdmin
    .from("civic_tax_payments")
    .insert({
      taxpayer_id: taxpayer_id,
      tax_type: tax_type,
      amount: amount,
      assessment_period: assessment_period,
      payment_method: payment_method,
      transaction_ref: transactionRef,
      status: "completed",
      paid_at: new Date().toISOString()
    })
    .select()
    .single();

  // Record wallet transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: userId,
    transaction_type: "tax_payment",
    direction: "debit",
    amount: amount,
    net_amount: -amount,
    status: "completed",
    metadata: { taxpayer_id, tax_type, transaction_ref: transactionRef }
  });

  return {
    success: true,
    payment: {
      id: payment.id,
      transaction_ref: payment.transaction_ref,
      amount: payment.amount,
      status: payment.status
    },
    message: `Tax payment of KES ${amount} processed successfully.`
  };
}

// ============================================================
// ACTION: CALCULATE_TAX
// Calculate tax liability
// ============================================================
async function civicCalculateTax(supabaseAdmin, userId, params) {
  const { income, tax_type = "income", deductions = 0, filing_status = "single" } = params;

  if (!income || income < 0) {
    throw new Error("Invalid income amount");
  }

  // Progressive tax calculation (example for Kenya)
  let tax = 0;
  const taxableIncome = income - deductions;

  if (taxableIncome <= 24000) {
    tax = taxableIncome * 0.10;
  } else if (taxableIncome <= 32333) {
    tax = 2400 + (taxableIncome - 24000) * 0.25;
  } else if (taxableIncome <= 500000) {
    tax = 2400 + 2083.25 + (taxableIncome - 32333) * 0.30;
  } else if (taxableIncome <= 800000) {
    tax = 2400 + 2083.25 + 140300.10 + (taxableIncome - 500000) * 0.325;
  } else {
    tax = 2400 + 2083.25 + 140300.10 + 97500 + (taxableIncome - 800000) * 0.35;
  }

  // Apply filing status adjustment
  if (filing_status === "married") {
    tax = tax * 0.95; // 5% reduction for married filing
  }

  tax = Math.round(tax * 100) / 100;

  return {
    success: true,
    tax_calculation: {
      gross_income: income,
      deductions: deductions,
      taxable_income: taxableIncome,
      tax_liability: tax,
      effective_rate: Math.round((tax / income) * 10000) / 100,
      tax_type: tax_type,
      filing_status: filing_status
    },
    message: `Tax calculated: KES ${tax} on taxable income of KES ${taxableIncome}.`
  };
}

// ============================================================
// ACTION: PROCESS_EXPENDITURE
// Process government expenditure
// ============================================================
async function civicProcessExpenditure(supabaseAdmin, userId, params) {
  const { voucher_id, amount, description, department_id, budget_line_id } = params;

  if (!voucher_id || !amount || !description) {
    throw new Error("Missing voucher_id, amount, or description");
  }

  // Verify voucher
  const { data: voucher } = await supabaseAdmin
    .from("civic_vouchers")
    .select("*")
    .eq("voucher_id", voucher_id)
    .eq("status", "approved")
    .single();

  if (!voucher) {
    throw new Error("Voucher not found or not approved");
  }

  if (voucher.amount < amount) {
    throw new Error("Expenditure exceeds voucher amount");
  }

  // Record expenditure
  const { data: expenditure } = await supabaseAdmin
    .from("civic_expenditures")
    .insert({
      voucher_id: voucher_id,
      amount: amount,
      description: description,
      department_id: department_id,
      budget_line_id: budget_line_id,
      processed_by: userId,
      status: "completed",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Update voucher
  await supabaseAdmin
    .from("civic_vouchers")
    .update({
      status: "utilized",
      utilized_amount: amount,
      utilized_at: new Date().toISOString()
    })
    .eq("id", voucher.id);

  // Log audit
  await civicAuditLog(supabaseAdmin, userId, {
    entity_type: "expenditure",
    entity_id: expenditure.id,
    action_type: "expenditure_processed",
    details: { voucher_id, amount, department_id },
    module: "treasury"
  });

  return {
    success: true,
    expenditure: {
      id: expenditure.id,
      amount: expenditure.amount,
      status: expenditure.status
    },
    message: `Expenditure of KES ${amount} processed successfully.`
  };
}

// ============================================================
// ACTION: CONSOLIDATE_REVENUE
// Consolidate revenue across departments
// ============================================================
async function civicConsolidateRevenue(supabaseAdmin, userId, params) {
  const { period_start, period_end, department_id } = params;

  if (!period_start || !period_end) {
    throw new Error("Missing period_start or period_end");
  }

  // Verify treasury staff
  const { data: staff } = await supabaseAdmin
    .from("civic_staff")
    .select("role, department")
    .eq("user_id", userId)
    .eq("department", "treasury")
    .single();

  if (!staff) {
    throw new Error("Only treasury staff can consolidate revenue");
  }

  // Get revenue data
  let query = supabaseAdmin
    .from("civic_revenue")
    .select("*")
    .gte("created_at", period_start)
    .lte("created_at", period_end);

  if (department_id) {
    query = query.eq("department_id", department_id);
  }

  const { data: revenues } = await query;

  const totalRevenue = (revenues || []).reduce((sum, r) => sum + (r.amount || 0), 0);
  const byDepartment = {};
  (revenues || []).forEach(r => {
    const dept = r.department_id || "unknown";
    byDepartment[dept] = (byDepartment[dept] || 0) + (r.amount || 0);
  });

  // Create consolidation record
  const { data: consolidation } = await supabaseAdmin
    .from("civic_revenue_consolidations")
    .insert({
      period_start: period_start,
      period_end: period_end,
      department_id: department_id,
      total_revenue: totalRevenue,
      breakdown: byDepartment,
      consolidated_by: userId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    consolidation: {
      id: consolidation.id,
      period_start: consolidation.period_start,
      period_end: consolidation.period_end,
      total_revenue: consolidation.total_revenue,
      breakdown: consolidation.breakdown
    },
    message: `Revenue consolidated: KES ${totalRevenue} for period ${period_start} to ${period_end}.`
  };
}
