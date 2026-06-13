// ============================================================
// MTAA COUNTY PROTOCOL — EDGE FUNCTIONS
// Consolidated: county-operations
// Actions: county_create, county_staff_add, county_service_config, 
//          county_citizen_register, county_license_apply
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
      case "county_create":
        result = await countyCreate(supabaseAdmin, user.id, params);
        break;
      case "county_staff_add":
        result = await countyStaffAdd(supabaseAdmin, user.id, params);
        break;
      case "county_service_config":
        result = await countyServiceConfig(supabaseAdmin, user.id, params);
        break;
      case "county_citizen_register":
        result = await countyCitizenRegister(supabaseAdmin, user.id, params);
        break;
      case "county_license_apply":
        result = await countyLicenseApply(supabaseAdmin, user.id, params);
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
// ACTION 1: COUNTY_CREATE
// Governor opens a new county account
// ============================================================
async function countyCreate(supabaseAdmin, governorId, params) {
  const { name, country, region, county_code, subdomain, logo_url, primary_color, secondary_color, coat_of_arms_url, email, phone, physical_address } = params;

  // Validate required fields
  if (!name || !country || !county_code) {
    throw new Error("Missing required fields: name, country, county_code");
  }

  // Check if governor already has a county in this country
  const { data: existingCounty } = await supabaseAdmin
    .from("counties")
    .select("id")
    .eq("governor_id", governorId)
    .eq("country", country)
    .single();

  if (existingCounty) {
    throw new Error("Governor already has a county in this country");
  }

  // Check if county_code or subdomain already exists
  const { data: existingCode } = await supabaseAdmin
    .from("counties")
    .select("id")
    .or(`county_code.eq.${county_code},subdomain.eq.${subdomain || ""}`)
    .single();

  if (existingCode) {
    throw new Error("County code or subdomain already exists");
  }

  // Create county wallet for the county (every account gets a wallet)
  const { data: countyWallet, error: walletError } = await supabaseAdmin
    .from("wallets")
    .insert({
      user_id: governorId,
      wallet_type: "main",
      wallet_name: `${name} County Treasury`,
      currency_code: "KES",
      available_balance: 0,
      pending_balance: 0,
      is_active: true,
      metadata: { entity_type: "county", county_code }
    })
    .select()
    .single();

  if (walletError) throw new Error("Failed to create county wallet: " + walletError.message);

  // Create county record
  const { data: county, error: countyError } = await supabaseAdmin
    .from("counties")
    .insert({
      name,
      country,
      region,
      county_code,
      subdomain,
      status: "active",
      governor_id: governorId,
      it_admin_id: governorId, // Governor is initially IT admin
      logo_url,
      primary_color: primary_color || "#1a73e8",
      secondary_color: secondary_color || "#34a853",
      coat_of_arms_url,
      county_wallet_id: countyWallet.id,
      email,
      phone,
      physical_address,
      auto_penalty_enabled: true,
      penalty_rate: 5.00,
      grace_period_days: 14
    })
    .select()
    .single();

  if (countyError) throw new Error("Failed to create county: " + countyError.message);

  // Add governor as IT admin in county_staff
  await supabaseAdmin.from("county_staff").insert({
    county_id: county.id,
    user_id: governorId,
    role: "it_admin",
    permissions: {
      can_manage_staff: true,
      can_configure_services: true,
      can_view_analytics: true,
      can_manage_enforcement: true,
      can_generate_reports: true,
      can_override_payments: true
    },
    status: "active"
  });

  // Auto-create 10 default services for the county
  const defaultServices = [
    { service_code: "SBP", service_name: "Single Business Permit", category: "business_permit", base_cost: 5000, cost_type: "fixed", billing_cycle: "annual", description: "Annual business operating permit", required_documents: ["ID","PIN","business_reg"] },
    { service_code: "PARKING", service_name: "Parking Fees", category: "parking", base_cost: 200, cost_type: "daily", billing_cycle: "daily", description: "Daily parking fee for vehicles", required_documents: ["vehicle_reg"] },
    { service_code: "MARKET", service_name: "Market Stall Fees", category: "market", base_cost: 1000, cost_type: "fixed", billing_cycle: "monthly", description: "Monthly market stall rental", required_documents: ["ID"] },
    { service_code: "LAND", service_name: "Land/Property Rates", category: "land_rate", base_cost: 2000, cost_type: "per_sqm", billing_cycle: "annual", description: "Annual land and property rates", required_documents: ["title_deed","ID"] },
    { service_code: "BUILDING", service_name: "Building Plan Approval", category: "building", base_cost: 10000, cost_type: "fixed", billing_cycle: "once", description: "Building plan approval fee", required_documents: ["architectural_plans","ID","PIN"] },
    { service_code: "ADVERT", service_name: "Advertisement/Billboard Permit", category: "advertisement", base_cost: 15000, cost_type: "fixed", billing_cycle: "annual", description: "Annual billboard advertisement permit", required_documents: ["ID","location_photos"] },
    { service_code: "HEALTH", service_name: "Health Permit", category: "health", base_cost: 3000, cost_type: "fixed", billing_cycle: "annual", description: "Health and sanitation permit", required_documents: ["ID","medical_cert"] },
    { service_code: "FIRE", service_name: "Fire Safety Certificate", category: "fire_safety", base_cost: 2500, cost_type: "fixed", billing_cycle: "annual", description: "Fire safety compliance certificate", required_documents: ["ID","fire_equipment_cert"] },
    { service_code: "LIQUOR", service_name: "Liquor License", category: "liquor", base_cost: 10000, cost_type: "fixed", billing_cycle: "annual", description: "Liquor selling license", required_documents: ["ID","police_clearance","business_reg"] },
    { service_code: "CESS", service_name: "CESS Permit", category: "cess", base_cost: 1500, cost_type: "fixed", billing_cycle: "quarterly", description: "Quarry, sand, agricultural cess", required_documents: ["ID","business_reg"] }
  ];

  const servicesWithCounty = defaultServices.map(s => ({
    ...s,
    county_id: county.id,
    is_active: true,
    renewal_reminder_days: 30
  }));

  await supabaseAdmin.from("county_services").insert(servicesWithCounty);

  return {
    success: true,
    county: {
      id: county.id,
      name: county.name,
      county_code: county.county_code,
      subdomain: county.subdomain,
      status: county.status,
      county_wallet_id: countyWallet.id
    },
    services_created: defaultServices.length,
    message: `County "${name}" created successfully with ${defaultServices.length} default services.`
  };
}

// ============================================================
// ACTION 2: COUNTY_STAFF_ADD
// IT admin adds officers to the county
// ============================================================
async function countyStaffAdd(supabaseAdmin, callerId, params) {
  const { county_id, user_id, role, permissions, assigned_ward, assigned_zone, workstation_id } = params;

  if (!county_id || !user_id || !role) {
    throw new Error("Missing required fields: county_id, user_id, role");
  }

  // Verify caller is IT admin or supervisor for this county
  const { data: callerStaff } = await supabaseAdmin
    .from("county_staff")
    .select("role, permissions")
    .eq("county_id", county_id)
    .eq("user_id", callerId)
    .single();

  if (!callerStaff || !["it_admin", "supervisor"].includes(callerStaff.role)) {
    throw new Error("Only IT admin or supervisor can add staff");
  }

  // Check if user is already staff in this county
  const { data: existingStaff } = await supabaseAdmin
    .from("county_staff")
    .select("id")
    .eq("county_id", county_id)
    .eq("user_id", user_id)
    .single();

  if (existingStaff) {
    throw new Error("User is already staff in this county");
  }

  // Create staff wallet (every account gets a wallet)
  const { data: staffWallet } = await supabaseAdmin
    .from("wallets")
    .insert({
      user_id: user_id,
      wallet_type: "main",
      wallet_name: `County Staff - ${role}`,
      currency_code: "KES",
      available_balance: 0,
      pending_balance: 0,
      is_active: true,
      metadata: { entity_type: "county_staff", county_id, role }
    })
    .select()
    .single();

  // Default permissions per role
  const defaultPermissions = {
    it_admin: { can_manage_staff: true, can_configure_services: true, can_view_analytics: true, can_manage_enforcement: true, can_generate_reports: true, can_override_payments: true },
    revenue_officer: { can_collect_payments: true, can_view_bills: true, can_generate_receipts: true, can_view_analytics: false },
    enforcement_officer: { can_scan_qr: true, can_issue_penalties: true, can_view_licenses: true, can_seal_premises: true },
    license_officer: { can_process_applications: true, can_issue_licenses: true, can_view_documents: true },
    finance_officer: { can_view_transactions: true, can_generate_reports: true, can_reconcile_accounts: true, can_view_analytics: true },
    clerk: { can_process_applications: true, can_view_bills: true, can_generate_receipts: false },
    supervisor: { can_manage_staff: true, can_view_analytics: true, can_generate_reports: true, can_override_payments: true }
  };

  const { data: staff, error } = await supabaseAdmin
    .from("county_staff")
    .insert({
      county_id,
      user_id,
      role,
      permissions: permissions || defaultPermissions[role] || {},
      workstation_id,
      assigned_ward,
      assigned_zone,
      status: "active",
      staff_wallet_id: staffWallet?.id || null
    })
    .select()
    .single();

  if (error) throw new Error("Failed to add staff: " + error.message);

  return {
    success: true,
    staff: {
      id: staff.id,
      county_id: staff.county_id,
      user_id: staff.user_id,
      role: staff.role,
      status: staff.status
    },
    message: `Staff added successfully as ${role}.`
  };
}

// ============================================================
// ACTION 3: COUNTY_SERVICE_CONFIG
// IT admin configures revenue streams
// ============================================================
async function countyServiceConfig(supabaseAdmin, callerId, params) {
  const { county_id, service_id, updates } = params;

  if (!county_id || !service_id || !updates) {
    throw new Error("Missing required fields: county_id, service_id, updates");
  }

  // Verify caller is IT admin for this county
  const { data: callerStaff } = await supabaseAdmin
    .from("county_staff")
    .select("role")
    .eq("county_id", county_id)
    .eq("user_id", callerId)
    .single();

  if (!callerStaff || callerStaff.role !== "it_admin") {
    throw new Error("Only IT admin can configure services");
  }

  // Verify service belongs to this county
  const { data: existingService } = await supabaseAdmin
    .from("county_services")
    .select("*")
    .eq("id", service_id)
    .eq("county_id", county_id)
    .single();

  if (!existingService) {
    throw new Error("Service not found or does not belong to this county");
  }

  // Allowed update fields
  const allowedFields = [
    "base_cost", "cost_type", "cost_formula", "billing_cycle",
    "renewal_reminder_days", "required_documents", "approval_workflow",
    "is_active", "is_mandatory", "description", "instructions"
  ];

  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  filteredUpdates.updated_at = new Date().toISOString();

  const { data: service, error } = await supabaseAdmin
    .from("county_services")
    .update(filteredUpdates)
    .eq("id", service_id)
    .eq("county_id", county_id)
    .select()
    .single();

  if (error) throw new Error("Failed to update service: " + error.message);

  return {
    success: true,
    service: {
      id: service.id,
      service_code: service.service_code,
      service_name: service.service_name,
      base_cost: service.base_cost,
      billing_cycle: service.billing_cycle,
      is_active: service.is_active
    },
    message: `Service "${service.service_name}" updated successfully.`
  };
}

// ============================================================
// ACTION 4: COUNTY_CITIZEN_REGISTER
// Citizen links to a county
// ============================================================
async function countyCitizenRegister(supabaseAdmin, citizenId, params) {
  const { county_id, id_number, kra_pin, ward, zone } = params;

  if (!county_id) {
    throw new Error("Missing required field: county_id");
  }

  // Verify county exists and is active
  const { data: county } = await supabaseAdmin
    .from("counties")
    .select("id, name, status")
    .eq("id", county_id)
    .single();

  if (!county || county.status !== "active") {
    throw new Error("County not found or not active");
  }

  // Check if citizen already registered
  const { data: existing } = await supabaseAdmin
    .from("county_citizens")
    .select("id")
    .eq("county_id", county_id)
    .eq("citizen_id", citizenId)
    .single();

  if (existing) {
    throw new Error("Citizen already registered in this county");
  }

  const { data: citizen, error } = await supabaseAdmin
    .from("county_citizens")
    .insert({
      county_id,
      citizen_id: citizenId,
      id_number,
      kra_pin,
      ward,
      zone,
      account_status: "active"
    })
    .select()
    .single();

  if (error) throw new Error("Failed to register citizen: " + error.message);

  return {
    success: true,
    citizen: {
      id: citizen.id,
      county_id: citizen.county_id,
      county_name: county.name,
      account_status: citizen.account_status
    },
    message: `Successfully registered in ${county.name}.`
  };
}

// ============================================================
// ACTION 5: COUNTY_LICENSE_APPLY
// Citizen applies for a permit/license
// ============================================================
async function countyLicenseApply(supabaseAdmin, citizenId, params) {
  const { county_id, service_id, business_name, business_address, property_id, gps_coordinates, uploaded_documents } = params;

  if (!county_id || !service_id) {
    throw new Error("Missing required fields: county_id, service_id");
  }

  // Verify citizen is registered in this county
  const { data: citizenRecord } = await supabaseAdmin
    .from("county_citizens")
    .select("id, account_status")
    .eq("county_id", county_id)
    .eq("citizen_id", citizenId)
    .single();

  if (!citizenRecord) {
    throw new Error("Citizen not registered in this county. Please register first.");
  }

  if (citizenRecord.account_status === "blacklisted") {
    throw new Error("Your account is blacklisted. Contact county administration.");
  }

  // Verify service exists and is active
  const { data: service } = await supabaseAdmin
    .from("county_services")
    .select("*")
    .eq("id", service_id)
    .eq("county_id", county_id)
    .eq("is_active", true)
    .single();

  if (!service) {
    throw new Error("Service not found or not available");
  }

  // Calculate cost based on cost_type
  let totalCost = service.base_cost;
  if (service.cost_type === "per_sqm" && params.square_meters) {
    totalCost = service.base_cost * params.square_meters;
  } else if (service.cost_type === "per_employee" && params.employee_count) {
    totalCost = service.base_cost * params.employee_count;
  } else if (service.cost_type === "percentage" && params.annual_turnover) {
    totalCost = (service.base_cost / 100) * params.annual_turnover;
  }

  // Calculate expiry date based on billing_cycle
  const issuedAt = new Date();
  let expiresAt = new Date(issuedAt);
  switch (service.billing_cycle) {
    case "daily": expiresAt.setDate(expiresAt.getDate() + 1); break;
    case "weekly": expiresAt.setDate(expiresAt.getDate() + 7); break;
    case "monthly": expiresAt.setMonth(expiresAt.getMonth() + 1); break;
    case "quarterly": expiresAt.setMonth(expiresAt.getMonth() + 3); break;
    case "annual": expiresAt.setFullYear(expiresAt.getFullYear() + 1); break;
    default: expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  // Create license (license_number auto-generated by trigger)
  const { data: license, error: licenseError } = await supabaseAdmin
    .from("county_licenses")
    .insert({
      county_id,
      citizen_id: citizenId,
      service_id,
      license_type: service.service_name,
      business_name,
      business_address,
      property_id,
      gps_coordinates: gps_coordinates ? `(${gps_coordinates.lng},${gps_coordinates.lat})` : null,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
      uploaded_documents: uploaded_documents || [],
      total_paid: 0
    })
    .select()
    .single();

  if (licenseError) throw new Error("Failed to create license: " + licenseError.message);

  // Create initial bill for the license
  const { data: bill, error: billError } = await supabaseAdmin
    .from("county_bills")
    .insert({
      county_id,
      citizen_id: citizenId,
      service_id,
      license_id: license.id,
      description: `${service.service_name} - ${service.billing_cycle} fee`,
      amount: totalCost,
      due_date: expiresAt.toISOString().split("T")[0],
      status: "pending"
    })
    .select()
    .single();

  if (billError) throw new Error("Failed to create bill: " + billError.message);

  // Create QR code data for enforcement scanning
  const qrData = {
    license_id: license.id,
    license_number: license.license_number,
    county_code: county_id,
    service_code: service.service_code,
    citizen_id: citizenId,
    expires_at: expiresAt.toISOString(),
    status: "active"
  };

  await supabaseAdmin
    .from("county_licenses")
    .update({ qr_data: qrData })
    .eq("id", license.id);

  return {
    success: true,
    license: {
      id: license.id,
      license_number: license.license_number,
      service_name: service.service_name,
      status: license.status,
      expires_at: license.expires_at
    },
    bill: {
      id: bill.id,
      bill_number: bill.bill_number,
      amount: bill.amount,
      total_amount: bill.total_amount,
      status: bill.status,
      due_date: bill.due_date
    },
    message: `License application submitted. Bill ${bill.bill_number} generated for KES ${totalCost}.`
  };
}
// ============================================================
// MTAA COUNTY PROTOCOL — EDGE FUNCTIONS PART 2
// Actions: county_bill_generate, county_payment_process, 
//          county_enforcement_scan, county_enforcement_penalty, 
//          county_analytics_dashboard
// ============================================================
// ADD THESE CASES TO THE SWITCH STATEMENT IN county-operations/index.ts
// AFTER THE EXISTING 5 ACTIONS
// ============================================================

// ADD TO SWITCH:
//      case "county_bill_generate":
//        result = await countyBillGenerate(supabaseAdmin, user.id, params);
//        break;
//      case "county_payment_process":
//        result = await countyPaymentProcess(supabaseAdmin, user.id, params);
//        break;
//      case "county_enforcement_scan":
//        result = await countyEnforcementScan(supabaseAdmin, user.id, params);
//        break;
//      case "county_enforcement_penalty":
//        result = await countyEnforcementPenalty(supabaseAdmin, user.id, params);
//        break;
//      case "county_analytics_dashboard":
//        result = await countyAnalyticsDashboard(supabaseAdmin, user.id, params);
//        break;

// ============================================================
// ACTION 6: COUNTY_BILL_GENERATE
// Auto-generate renewal bills for expiring licenses (cron or manual)
// ============================================================
async function countyBillGenerate(supabaseAdmin, callerId, params) {
  const { county_id, license_id, manual = false } = params;

  if (!county_id) {
    throw new Error("Missing required field: county_id");
  }

  // Verify caller is staff for this county
  const { data: callerStaff } = await supabaseAdmin
    .from("county_staff")
    .select("role")
    .eq("county_id", county_id)
    .eq("user_id", callerId)
    .single();

  if (!callerStaff || !["it_admin", "finance_officer", "supervisor", "revenue_officer"].includes(callerStaff.role)) {
    throw new Error("Only county staff can generate bills");
  }

  let licensesToBill = [];

  if (license_id) {
    // Generate bill for specific license
    const { data: license } = await supabaseAdmin
      .from("county_licenses")
      .select("*, county_services(base_cost, billing_cycle, cost_type, service_name)")
      .eq("id", license_id)
      .eq("county_id", county_id)
      .single();
    if (!license) throw new Error("License not found");
    licensesToBill = [license];
  } else {
    // Auto-generate for all expiring licenses (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringLicenses } = await supabaseAdmin
      .from("county_licenses")
      .select("*, county_services(base_cost, billing_cycle, cost_type, service_name)")
      .eq("county_id", county_id)
      .eq("status", "active")
      .lte("expires_at", thirtyDaysFromNow.toISOString())
      .gt("expires_at", new Date().toISOString());

    licensesToBill = expiringLicenses || [];
  }

  const generatedBills = [];
  for (const license of licensesToBill) {
    const service = license.county_services;

    // Calculate renewal cost
    let renewalCost = service.base_cost;
    if (service.cost_type === "per_sqm" && license.business_address) {
      // Would need property data; default to base_cost for now
      renewalCost = service.base_cost;
    }

    // Calculate new expiry date
    const currentExpiry = new Date(license.expires_at);
    let newExpiry = new Date(currentExpiry);
    switch (service.billing_cycle) {
      case "daily": newExpiry.setDate(newExpiry.getDate() + 1); break;
      case "weekly": newExpiry.setDate(newExpiry.getDate() + 7); break;
      case "monthly": newExpiry.setMonth(newExpiry.getMonth() + 1); break;
      case "quarterly": newExpiry.setMonth(newExpiry.getMonth() + 3); break;
      case "annual": newExpiry.setFullYear(newExpiry.getFullYear() + 1); break;
      default: newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    }

    // Create renewal bill
    const { data: bill, error: billError } = await supabaseAdmin
      .from("county_bills")
      .insert({
        county_id,
        citizen_id: license.citizen_id,
        service_id: license.service_id,
        license_id: license.id,
        description: `${service.service_name} - Renewal`,
        amount: renewalCost,
        due_date: currentExpiry.toISOString().split("T")[0],
        status: "pending"
      })
      .select()
      .single();

    if (billError) {
      console.error("Failed to create bill for license", license.id, billError);
      continue;
    }

    // Update license status to pending_renewal
    await supabaseAdmin
      .from("county_licenses")
      .update({ status: "pending_renewal", renewed_at: null })
      .eq("id", license.id);

    // Send notification to citizen
    await supabaseAdmin.from("notifications").insert({
      user_id: license.citizen_id,
      actor_id: callerId,
      type: "county_bill",
      post_id: bill.id, // Using post_id as bill reference
      is_read: false
    });

    generatedBills.push({
      bill_id: bill.id,
      bill_number: bill.bill_number,
      license_id: license.id,
      license_number: license.license_number,
      amount: renewalCost,
      due_date: bill.due_date
    });
  }

  return {
    success: true,
    bills_generated: generatedBills.length,
    bills: generatedBills,
    message: `${generatedBills.length} renewal bill(s) generated successfully.`
  };
}

// ============================================================
// ACTION 7: COUNTY_PAYMENT_PROCESS
// Citizen pays a bill via MTAA Wallet
// Flow: Debit citizen wallet → Credit county wallet → Deduct MTAA fee → Record everything
// ============================================================
async function countyPaymentProcess(supabaseAdmin, citizenId, params) {
  const { bill_id, county_id } = params;

  if (!bill_id || !county_id) {
    throw new Error("Missing required fields: bill_id, county_id");
  }

  // Get bill details
  const { data: bill } = await supabaseAdmin
    .from("county_bills")
    .select("*, county_services(service_name, service_code), counties(county_wallet_id, name)")
    .eq("id", bill_id)
    .eq("county_id", county_id)
    .eq("citizen_id", citizenId)
    .single();

  if (!bill) throw new Error("Bill not found or does not belong to you");
  if (bill.status === "paid") throw new Error("Bill already paid");
  if (bill.status === "cancelled") throw new Error("Bill has been cancelled");

  const totalAmount = bill.total_amount;

  // Get citizen's main wallet
  const { data: citizenWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance, currency_code")
    .eq("user_id", citizenId)
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .single();

  if (!citizenWallet) throw new Error("No active wallet found");
  if (citizenWallet.available_balance < totalAmount) {
    throw new Error(`Insufficient balance. Required: KES ${totalAmount}, Available: KES ${citizenWallet.available_balance}`);
  }

  // Get county wallet
  const countyWalletId = bill.counties.county_wallet_id;
  if (!countyWalletId) throw new Error("County wallet not configured");

  const { data: countyWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, user_id")
    .eq("id", countyWalletId)
    .single();

  if (!countyWallet) throw new Error("County wallet not found");

  // Get MTAA fee percentage from platform_fees
  const { data: feeConfig } = await supabaseAdmin
    .from("platform_fees")
    .select("percentage")
    .eq("module", "county")
    .eq("active", true)
    .maybeSingle();

  const feePercentage = feeConfig?.percentage || 1.5; // Default 1.5% if not configured
  const mtaaFee = Math.round(totalAmount * (feePercentage / 100) * 100) / 100;
  const netAmount = totalAmount - mtaaFee;

  // Get MTAA treasury wallet (system wallet for fees)
  const { data: mtaaWallet } = await supabaseAdmin
    .from("wallets")
    .select("id")
    .eq("wallet_type", "main")
    .eq("is_active", true)
    .ilike("wallet_name", "%MTAA%")
    .maybeSingle();

  // STEP 1: Debit citizen wallet
  const { error: debitError } = await supabaseAdmin
    .from("wallets")
    .update({ available_balance: citizenWallet.available_balance - totalAmount })
    .eq("id", citizenWallet.id)
    .eq("available_balance", citizenWallet.available_balance); // Optimistic locking

  if (debitError) throw new Error("Failed to debit citizen wallet: " + debitError.message);

  // STEP 2: Credit county wallet
  const { data: countyWalletCurrent } = await supabaseAdmin
    .from("wallets")
    .select("available_balance")
    .eq("id", countyWalletId)
    .single();

  const { error: creditError } = await supabaseAdmin
    .from("wallets")
    .update({ available_balance: (countyWalletCurrent?.available_balance || 0) + netAmount })
    .eq("id", countyWalletId);

  if (creditError) {
    // Rollback citizen wallet
    await supabaseAdmin
      .from("wallets")
      .update({ available_balance: citizenWallet.available_balance })
      .eq("id", citizenWallet.id);
    throw new Error("Failed to credit county wallet: " + creditError.message);
  }

  // STEP 3: Credit MTAA fee wallet (if exists)
  if (mtaaWallet && mtaaFee > 0) {
    const { data: mtaaCurrent } = await supabaseAdmin
      .from("wallets")
      .select("available_balance")
      .eq("id", mtaaWallet.id)
      .single();

    await supabaseAdmin
      .from("wallets")
      .update({ available_balance: (mtaaCurrent?.available_balance || 0) + mtaaFee })
      .eq("id", mtaaWallet.id);
  }

  // STEP 4: Record wallet transactions
  const transactionRef = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Citizen debit transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: citizenWallet.id,
    user_id: citizenId,
    transaction_type: "county_payment",
    direction: "debit",
    amount: totalAmount,
    net_amount: -totalAmount,
    status: "completed",
    counterparty_wallet_id: countyWalletId,
    metadata: {
      bill_id: bill.id,
      bill_number: bill.bill_number,
      county_id: county_id,
      service_name: bill.county_services.service_name,
      mtaa_fee: mtaaFee,
      transaction_ref: transactionRef
    }
  });

  // County credit transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: countyWalletId,
    user_id: countyWallet.user_id,
    transaction_type: "county_revenue",
    direction: "credit",
    amount: netAmount,
    net_amount: netAmount,
    status: "completed",
    counterparty_wallet_id: citizenWallet.id,
    metadata: {
      bill_id: bill.id,
      bill_number: bill.bill_number,
      citizen_id: citizenId,
      service_name: bill.county_services.service_name,
      mtaa_fee: mtaaFee,
      transaction_ref: transactionRef
    }
  });

  // MTAA fee transaction (if wallet exists)
  if (mtaaWallet && mtaaFee > 0) {
    await supabaseAdmin.from("wallet_transactions").insert({
      wallet_id: mtaaWallet.id,
      user_id: mtaaWallet.user_id,
      transaction_type: "platform_fee",
      direction: "credit",
      amount: mtaaFee,
      net_amount: mtaaFee,
      status: "completed",
      counterparty_wallet_id: citizenWallet.id,
      metadata: {
        bill_id: bill.id,
        module: "county",
        fee_percentage: feePercentage,
        transaction_ref: transactionRef
      }
    });

    // Record in creator_earnings as platform fee
    await supabaseAdmin.from("creator_earnings").insert({
      user_id: mtaaWallet.user_id,
      source_id: bill.id,
      module: "county",
      source_module: "county",
      source_table: "county_bills",
      earning_type: "platform_bonus",
      gross_amount: totalAmount,
      platform_fee: mtaaFee,
      net_amount: mtaaFee,
      currency: "KES",
      status: "credited"
    });
  }

  // STEP 5: Update bill status
  const { data: updatedBill } = await supabaseAdmin
    .from("county_bills")
    .update({
      status: "paid",
      payment_id: transactionRef,
      paid_at: new Date().toISOString()
    })
    .eq("id", bill_id)
    .select()
    .single();

  // STEP 6: Update license payment tracking
  if (bill.license_id) {
    await supabaseAdmin
      .from("county_licenses")
      .update({
        last_payment_id: transactionRef,
        total_paid: supabaseAdmin.rpc("increment", { x: totalAmount }) // Note: use raw SQL or fetch+update
      })
      .eq("id", bill.license_id);
  }

  // STEP 7: Record county-specific transaction
  await supabaseAdmin.from("county_transactions").insert({
    county_id: county_id,
    bill_id: bill_id,
    payer_wallet_id: citizenWallet.id,
    payee_wallet_id: countyWalletId,
    amount: totalAmount,
    mtaa_fee: mtaaFee,
    transaction_ref: transactionRef,
    status: "completed",
    payment_method: "mtaa_wallet",
    metadata: {
      citizen_id: citizenId,
      service_name: bill.county_services.service_name,
      fee_percentage: feePercentage
    },
    completed_at: new Date().toISOString()
  });

  // STEP 8: Send notifications
  await supabaseAdmin.from("notifications").insert([
    {
      user_id: citizenId,
      actor_id: citizenId,
      type: "county_payment_success",
      post_id: bill.id,
      is_read: false
    },
    {
      user_id: countyWallet.user_id,
      actor_id: citizenId,
      type: "county_revenue_received",
      post_id: bill.id,
      is_read: false
    }
  ]);

  return {
    success: true,
    transaction_ref: transactionRef,
    amount_paid: totalAmount,
    mtaa_fee: mtaaFee,
    net_to_county: netAmount,
    bill: {
      id: updatedBill.id,
      bill_number: updatedBill.bill_number,
      status: updatedBill.status,
      paid_at: updatedBill.paid_at
    },
    message: `Payment successful. KES ${totalAmount} paid (Fee: KES ${mtaaFee}, County receives: KES ${netAmount}).`
  };
}

// ============================================================
// ACTION 8: COUNTY_ENFORCEMENT_SCAN
// Officer scans QR code, checks license validity
// ============================================================
async function countyEnforcementScan(supabaseAdmin, officerUserId, params) {
  const { qr_data, license_id, county_id, gps_location, ward, zone } = params;

  if (!county_id) {
    throw new Error("Missing required field: county_id");
  }

  // Verify officer is enforcement staff for this county
  const { data: officer } = await supabaseAdmin
    .from("county_staff")
    .select("id, role, county_id")
    .eq("county_id", county_id)
    .eq("user_id", officerUserId)
    .single();

  if (!officer || !["enforcement_officer", "supervisor", "it_admin"].includes(officer.role)) {
    throw new Error("Only enforcement officers can scan licenses");
  }

  let license = null;
  let scanResult = {
    valid: false,
    license_id: null,
    license_number: null,
    status: null,
    expires_at: null,
    business_name: null,
    violation_found: false,
    violation_type: null
  };

  if (qr_data) {
    // Parse QR data
    try {
      const parsedQr = typeof qr_data === "string" ? JSON.parse(qr_data) : qr_data;
      const { data: foundLicense } = await supabaseAdmin
        .from("county_licenses")
        .select("*, county_services(service_name), county_citizens(citizen_id, account_status)")
        .eq("id", parsedQr.license_id)
        .eq("county_id", county_id)
        .single();
      license = foundLicense;
    } catch (e) {
      throw new Error("Invalid QR code data");
    }
  } else if (license_id) {
    const { data: foundLicense } = await supabaseAdmin
      .from("county_licenses")
      .select("*, county_services(service_name), county_citizens(citizen_id, account_status)")
      .eq("id", license_id)
      .eq("county_id", county_id)
      .single();
    license = foundLicense;
  }

  if (!license) {
    throw new Error("License not found");
  }

  // Check validity
  const now = new Date();
  const expiry = new Date(license.expires_at);
  const isExpired = expiry < now;
  const isSuspended = license.status === "suspended" || license.status === "revoked";
  const citizenBlacklisted = license.county_citizens?.account_status === "blacklisted";

  scanResult = {
    valid: !isExpired && !isSuspended && !citizenBlacklisted,
    license_id: license.id,
    license_number: license.license_number,
    status: license.status,
    expires_at: license.expires_at,
    business_name: license.business_name,
    violation_found: isExpired || isSuspended || citizenBlacklisted,
    violation_type: isExpired ? "expired" : isSuspended ? "suspended" : citizenBlacklisted ? "blacklisted_citizen" : null
  };

  // Record enforcement action
  const { data: action } = await supabaseAdmin
    .from("county_enforcement")
    .insert({
      county_id: county_id,
      officer_id: officer.id,
      citizen_id: license.citizen_id,
      license_id: license.id,
      action_type: "scan_qr",
      gps_location: gps_location ? `(${gps_location.lng},${gps_location.lat})` : null,
      ward,
      zone,
      findings: scanResult,
      violation_found: scanResult.violation_found,
      violation_type: scanResult.violation_type
    })
    .select()
    .single();

  return {
    success: true,
    scan_result: scanResult,
    enforcement_action_id: action.id,
    message: scanResult.valid 
      ? `License ${license.license_number} is VALID. Expires ${license.expires_at}.` 
      : `VIOLATION DETECTED: ${scanResult.violation_type}. License ${license.license_number}.`
  };
}

// ============================================================
// ACTION 9: COUNTY_ENFORCEMENT_PENALTY
// Officer issues on-the-spot penalty
// ============================================================
async function countyEnforcementPenalty(supabaseAdmin, officerUserId, params) {
  const { county_id, license_id, citizen_id, penalty_amount, violation_type, officer_notes, evidence_photos, gps_location, ward, zone } = params;

  if (!county_id || !license_id || !penalty_amount || !violation_type) {
    throw new Error("Missing required fields: county_id, license_id, penalty_amount, violation_type");
  }

  // Verify officer
  const { data: officer } = await supabaseAdmin
    .from("county_staff")
    .select("id, role, county_id, permissions")
    .eq("county_id", county_id)
    .eq("user_id", officerUserId)
    .single();

  if (!officer || !["enforcement_officer", "supervisor"].includes(officer.role)) {
    throw new Error("Only enforcement officers can issue penalties");
  }

  // Check if officer has penalty permission
  const permissions = officer.permissions || {};
  if (!permissions.can_issue_penalties && officer.role !== "supervisor") {
    throw new Error("You do not have permission to issue penalties");
  }

  // Get license details
  const { data: license } = await supabaseAdmin
    .from("county_licenses")
    .select("*, county_services(service_name, service_id)")
    .eq("id", license_id)
    .eq("county_id", county_id)
    .single();

  if (!license) throw new Error("License not found");

  // Create penalty bill
  const { data: penaltyBill } = await supabaseAdmin
    .from("county_bills")
    .insert({
      county_id,
      citizen_id: citizen_id || license.citizen_id,
      service_id: license.service_id,
      license_id,
      description: `Penalty: ${violation_type} - ${license.license_number}`,
      amount: penalty_amount,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days to pay
      status: "pending"
    })
    .select()
    .single();

  // Record enforcement action
  const { data: action } = await supabaseAdmin
    .from("county_enforcement")
    .insert({
      county_id,
      officer_id: officer.id,
      citizen_id: citizen_id || license.citizen_id,
      license_id,
      action_type: "issue_penalty",
      gps_location: gps_location ? `(${gps_location.lng},${gps_location.lat})` : null,
      ward,
      zone,
      findings: { violation_type, penalty_amount, license_number: license.license_number },
      violation_found: true,
      violation_type,
      penalty_amount,
      penalty_bill_id: penaltyBill.id,
      evidence_photos: evidence_photos || [],
      officer_notes
    })
    .select()
    .single();

  // Notify citizen
  await supabaseAdmin.from("notifications").insert({
    user_id: citizen_id || license.citizen_id,
    actor_id: officerUserId,
    type: "county_penalty",
    post_id: penaltyBill.id,
    is_read: false
  });

  return {
    success: true,
    penalty_bill: {
      id: penaltyBill.id,
      bill_number: penaltyBill.bill_number,
      amount: penaltyBill.amount,
      due_date: penaltyBill.due_date,
      status: penaltyBill.status
    },
    enforcement_action_id: action.id,
    message: `Penalty issued: KES ${penalty_amount} for ${violation_type}. Bill ${penaltyBill.bill_number}. Pay within 7 days.`
  };
}

// ============================================================
// ACTION 10: COUNTY_ANALYTICS_DASHBOARD
// Real-time data for governor/admin
// ============================================================
async function countyAnalyticsDashboard(supabaseAdmin, callerId, params) {
  const { county_id, period = "today" } = params;

  if (!county_id) {
    throw new Error("Missing required field: county_id");
  }

  // Verify caller is staff for this county
  const { data: callerStaff } = await supabaseAdmin
    .from("county_staff")
    .select("role")
    .eq("county_id", county_id)
    .eq("user_id", callerId)
    .single();

  if (!callerStaff || !["it_admin", "supervisor", "finance_officer", "governor"].includes(callerStaff.role)) {
    throw new Error("Unauthorized to view county analytics");
  }

  // Date range based on period
  const now = new Date();
  let startDate, endDate;
  switch (period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "week":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  // Revenue metrics
  const { data: revenueData } = await supabaseAdmin
    .from("county_transactions")
    .select("amount, mtaa_fee, net_amount, status")
    .eq("county_id", county_id)
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());

  const totalRevenue = revenueData?.reduce((sum, tx) => sum + (tx.net_amount || 0), 0) || 0;
  const totalFees = revenueData?.reduce((sum, tx) => sum + (tx.mtaa_fee || 0), 0) || 0;
  const transactionCount = revenueData?.length || 0;

  // License metrics
  const { data: licenseMetrics } = await supabaseAdmin
    .from("county_licenses")
    .select("status")
    .eq("county_id", county_id);

  const activeLicenses = licenseMetrics?.filter(l => l.status === "active").length || 0;
  const expiredLicenses = licenseMetrics?.filter(l => l.status === "expired").length || 0;
  const pendingRenewals = licenseMetrics?.filter(l => l.status === "pending_renewal").length || 0;

  // Bill metrics
  const { data: billMetrics } = await supabaseAdmin
    .from("county_bills")
    .select("status, amount, total_amount")
    .eq("county_id", county_id)
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());

  const pendingBills = billMetrics?.filter(b => b.status === "pending").length || 0;
  const overdueBills = billMetrics?.filter(b => b.status === "overdue").length || 0;
  const paidBills = billMetrics?.filter(b => b.status === "paid").length || 0;
  const pendingAmount = billMetrics?.filter(b => b.status === "pending").reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
  const overdueAmount = billMetrics?.filter(b => b.status === "overdue").reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

  // Citizen count
  const { count: citizenCount } = await supabaseAdmin
    .from("county_citizens")
    .select("*", { count: "exact", head: true })
    .eq("county_id", county_id)
    .eq("account_status", "active");

  // Staff count
  const { count: staffCount } = await supabaseAdmin
    .from("county_staff")
    .select("*", { count: "exact", head: true })
    .eq("county_id", county_id)
    .eq("status", "active");

  // Enforcement actions
  const { data: enforcementData } = await supabaseAdmin
    .from("county_enforcement")
    .select("action_type, violation_found")
    .eq("county_id", county_id)
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());

  const enforcementActions = enforcementData?.length || 0;
  const violationsFound = enforcementData?.filter(e => e.violation_found).length || 0;

  // Revenue by service (from bills)
  const { data: serviceRevenue } = await supabaseAdmin
    .from("county_bills")
    .select("service_id, county_services(service_name), amount, status")
    .eq("county_id", county_id)
    .eq("status", "paid")
    .gte("created_at", startDate.toISOString())
    .lt("created_at", endDate.toISOString());

  const revenueByService = {};
  serviceRevenue?.forEach(bill => {
    const serviceName = bill.county_services?.service_name || "Unknown";
    revenueByService[serviceName] = (revenueByService[serviceName] || 0) + (bill.amount || 0);
  });

  return {
    success: true,
    period,
    county_id,
    summary: {
      total_revenue: totalRevenue,
      total_fees_collected: totalFees,
      transaction_count: transactionCount,
      active_licenses: activeLicenses,
      expired_licenses: expiredLicenses,
      pending_renewals: pendingRenewals,
      active_citizens: citizenCount || 0,
      active_staff: staffCount || 0,
      pending_bills: pendingBills,
      overdue_bills: overdueBills,
      paid_bills: paidBills,
      pending_amount: pendingAmount,
      overdue_amount: overdueAmount,
      enforcement_actions: enforcementActions,
      violations_found: violationsFound
    },
    revenue_by_service: revenueByService,
    message: `Analytics for ${period} retrieved successfully.`
  };
}
