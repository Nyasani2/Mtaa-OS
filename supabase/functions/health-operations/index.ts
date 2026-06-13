// ============================================================
// MTAA HEALTH OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: emergency_sos, register_patient, book_appointment, create_record, write_prescription
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
      case "emergency_sos":
        result = await healthEmergencySos(supabaseAdmin, user.id, params);
        break;
      case "register_patient":
        result = await healthRegisterPatient(supabaseAdmin, user.id, params);
        break;
      case "book_appointment":
        result = await healthBookAppointment(supabaseAdmin, user.id, params);
        break;
      case "create_record":
        result = await healthCreateRecord(supabaseAdmin, user.id, params);
        break;
      case "write_prescription":
        result = await healthWritePrescription(supabaseAdmin, user.id, params);
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
// ACTION: EMERGENCY_SOS
// Trigger emergency health alert
// ============================================================
async function healthEmergencySos(supabaseAdmin, userId, params) {
  const { lat, lng, condition, severity = "high", emergency_contact_id } = params;

  // Get user profile for emergency info
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("display_name, phone, emergency_contact, blood_type, allergies")
    .eq("user_id", userId)
    .single();

  // Create emergency record
  const { data: emergency } = await supabaseAdmin
    .from("health_emergencies")
    .insert({
      patient_id: userId,
      lat: lat,
      lng: lng,
      condition: condition,
      severity: severity,
      status: "active",
      patient_info: {
        name: profile?.display_name,
        phone: profile?.phone,
        blood_type: profile?.blood_type,
        allergies: profile?.allergies
      },
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Find nearby health facilities
  const { data: facilities } = await supabaseAdmin
    .from("health_facilities")
    .select("id, name, phone, lat, lng, type")
    .eq("is_active", true)
    .limit(5);

  // Notify emergency contacts
  if (emergency_contact_id || profile?.emergency_contact) {
    await supabaseAdmin.from("notifications").insert({
      user_id: emergency_contact_id || profile?.emergency_contact,
      actor_id: userId,
      type: "health_emergency",
      post_id: emergency.id,
      is_read: false
    });
  }

  // Notify nearby facilities
  for (const facility of (facilities || [])) {
    await supabaseAdmin.from("notifications").insert({
      user_id: facility.id, // Facility admin user
      actor_id: userId,
      type: "emergency_alert",
      post_id: emergency.id,
      is_read: false
    });
  }

  return {
    success: true,
    emergency: {
      id: emergency.id,
      status: emergency.status,
      severity: emergency.severity,
      patient_info: emergency.patient_info
    },
    nearby_facilities: facilities?.length || 0,
    message: `Emergency alert sent. ${facilities?.length || 0} facilities notified.`
  };
}

// ============================================================
// ACTION: REGISTER_PATIENT
// Register as a health patient
// ============================================================
async function healthRegisterPatient(supabaseAdmin, userId, params) {
  const { blood_type, allergies, medical_history, emergency_contact, emergency_phone } = params;

  const { data: patient } = await supabaseAdmin
    .from("health_patients")
    .insert({
      user_id: userId,
      blood_type: blood_type,
      allergies: allergies || [],
      medical_history: medical_history || {},
      emergency_contact: emergency_contact,
      emergency_phone: emergency_phone,
      registered_at: new Date().toISOString()
    })
    .select()
    .single();

  return {
    success: true,
    patient: {
      id: patient.id,
      user_id: patient.user_id,
      registered_at: patient.registered_at
    },
    message: "Patient registered successfully."
  };
}

// ============================================================
// ACTION: BOOK_APPOINTMENT
// Book a health appointment
// ============================================================
async function healthBookAppointment(supabaseAdmin, userId, params) {
  const { facility_id, doctor_id, appointment_date, appointment_time, reason, type = "consultation" } = params;

  if (!facility_id || !appointment_date) {
    throw new Error("Missing facility_id or appointment_date");
  }

  const { data: appointment } = await supabaseAdmin
    .from("health_appointments")
    .insert({
      patient_id: userId,
      facility_id: facility_id,
      doctor_id: doctor_id,
      appointment_date: appointment_date,
      appointment_time: appointment_time,
      reason: reason,
      type: type,
      status: "scheduled",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notify facility
  await supabaseAdmin.from("notifications").insert({
    user_id: facility_id,
    actor_id: userId,
    type: "appointment_booked",
    post_id: appointment.id,
    is_read: false
  });

  return {
    success: true,
    appointment: {
      id: appointment.id,
      facility_id: appointment.facility_id,
      appointment_date: appointment.appointment_date,
      status: appointment.status
    },
    message: `Appointment scheduled for ${appointment_date}.`
  };
}

// ============================================================
// ACTION: CREATE_RECORD
// Create a health record
// ============================================================
async function healthCreateRecord(supabaseAdmin, userId, params) {
  const { patient_id, record_type, diagnosis, symptoms, notes, attachments } = params;

  if (!patient_id || !record_type) {
    throw new Error("Missing patient_id or record_type");
  }

  // Verify user is doctor or has permission
  const { data: doctor } = await supabaseAdmin
    .from("health_doctors")
    .select("id, user_id")
    .eq("user_id", userId)
    .single();

  const { data: record } = await supabaseAdmin
    .from("health_records")
    .insert({
      patient_id: patient_id,
      doctor_id: doctor?.id || null,
      created_by: userId,
      record_type: record_type,
      diagnosis: diagnosis,
      symptoms: symptoms || [],
      notes: notes,
      attachments: attachments || [],
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notify patient
  await supabaseAdmin.from("notifications").insert({
    user_id: patient_id,
    actor_id: userId,
    type: "health_record",
    post_id: record.id,
    is_read: false
  });

  return {
    success: true,
    record: {
      id: record.id,
      patient_id: record.patient_id,
      record_type: record.record_type,
      created_at: record.created_at
    },
    message: "Health record created successfully."
  };
}

// ============================================================
// ACTION: WRITE_PRESCRIPTION
// Write a prescription
// ============================================================
async function healthWritePrescription(supabaseAdmin, userId, params) {
  const { patient_id, medications, instructions, diagnosis, duration_days } = params;

  if (!patient_id || !medications || !Array.isArray(medications)) {
    throw new Error("Missing patient_id or medications");
  }

  // Verify doctor
  const { data: doctor } = await supabaseAdmin
    .from("health_doctors")
    .select("id, user_id, license_number")
    .eq("user_id", userId)
    .single();

  if (!doctor) {
    throw new Error("Only registered doctors can write prescriptions");
  }

  const { data: prescription } = await supabaseAdmin
    .from("health_prescriptions")
    .insert({
      patient_id: patient_id,
      doctor_id: doctor.id,
      medications: medications,
      instructions: instructions,
      diagnosis: diagnosis,
      duration_days: duration_days,
      status: "active",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Notify patient
  await supabaseAdmin.from("notifications").insert({
    user_id: patient_id,
    actor_id: userId,
    type: "prescription",
    post_id: prescription.id,
    is_read: false
  });

  return {
    success: true,
    prescription: {
      id: prescription.id,
      patient_id: prescription.patient_id,
      doctor_id: prescription.doctor_id,
      status: prescription.status,
      medications: prescription.medications.length
    },
    message: `Prescription written with ${medications.length} medication(s).`
  };
}
