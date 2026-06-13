// ============================================================
// MTAA MTAXI OPERATIONS — CONSOLIDATED EDGE FUNCTION
// Actions: request, accept, complete, cancel, onboard_vehicle, inspection_payment, inspection_complete, vehicle_approval
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
      case "request":
        result = await mtaxiRequest(supabaseAdmin, user.id, params);
        break;
      case "accept":
        result = await mtaxiAccept(supabaseAdmin, user.id, params);
        break;
      case "complete":
        result = await mtaxiComplete(supabaseAdmin, user.id, params);
        break;
      case "cancel":
        result = await mtaxiCancel(supabaseAdmin, user.id, params);
        break;
      case "onboard_vehicle":
        result = await mtaxiOnboardVehicle(supabaseAdmin, user.id, params);
        break;
      case "inspection_payment":
        result = await mtaxiInspectionPayment(supabaseAdmin, user.id, params);
        break;
      case "inspection_complete":
        result = await mtaxiInspectionComplete(supabaseAdmin, user.id, params);
        break;
      case "vehicle_approval":
        result = await mtaxiVehicleApproval(supabaseAdmin, user.id, params);
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
// ACTION: REQUEST
// Rider requests a ride
// ============================================================
async function mtaxiRequest(supabaseAdmin, riderId, params) {
  const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, destination_address, vehicle_type = "taxi", service_type = "standard" } = params;

  if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
    throw new Error("Missing pickup or dropoff coordinates");
  }

  // Calculate distance and estimated fare
  const distanceKm = calculateDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
  const baseFare = service_type === "premium" ? 200 : 100;
  const perKmRate = service_type === "premium" ? 50 : 30;
  const estimatedFare = Math.round((baseFare + (distanceKm * perKmRate)) * 100) / 100;

  // Create ride
  const { data: ride } = await supabaseAdmin
    .from("rides")
    .insert({
      rider_id: riderId,
      rider_user_id: riderId,
      pickup_lat: pickup_lat,
      pickup_lng: pickup_lng,
      dropoff_lat: dropoff_lat,
      dropoff_lng: dropoff_lng,
      pickup_address: pickup_address,
      destination_address: destination_address,
      distance_km: distanceKm,
      estimated_fare: estimatedFare,
      fare_estimate: estimatedFare,
      vehicle_type: vehicle_type,
      service_type: service_type,
      status: "requested",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Find nearby available drivers
  const { data: nearbyDrivers } = await supabaseAdmin
    .from("drivers")
    .select("user_id, current_lat, current_lng, vehicle_type")
    .eq("vehicle_type", vehicle_type)
    .eq("is_available", true)
    .eq("verified", true)
    .not("current_lat", "is", null)
    .not("current_lng", "is", null);

  // Filter by distance (within 5km)
  const driversInRange = (nearbyDrivers || []).filter(driver => {
    const dist = calculateDistance(pickup_lat, pickup_lng, driver.current_lat, driver.current_lng);
    return dist <= 5;
  });

  return {
    success: true,
    ride: {
      id: ride.id,
      status: ride.status,
      estimated_fare: ride.estimated_fare,
      distance_km: ride.distance_km,
      pickup_address: ride.pickup_address,
      destination_address: ride.destination_address
    },
    nearby_drivers: driversInRange.length,
    message: `Ride requested. Estimated fare: KES ${estimatedFare}. ${driversInRange.length} drivers nearby.`
  };
}

// ============================================================
// ACTION: ACCEPT
// Driver accepts a ride request
// ============================================================
async function mtaxiAccept(supabaseAdmin, driverId, params) {
  const { ride_id } = params;

  if (!ride_id) {
    throw new Error("Missing ride_id");
  }

  // Verify driver
  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("user_id, is_available, verified")
    .eq("user_id", driverId)
    .single();

  if (!driver) throw new Error("Driver not found");
  if (!driver.verified) throw new Error("Driver not verified");
  if (!driver.is_available) throw new Error("Driver not available");

  // Get ride
  const { data: ride } = await supabaseAdmin
    .from("rides")
    .select("*")
    .eq("id", ride_id)
    .eq("status", "requested")
    .single();

  if (!ride) throw new Error("Ride not found or already accepted");

  // Update ride
  const { data: updatedRide } = await supabaseAdmin
    .from("rides")
    .update({
      driver_id: driverId,
      driver_user_id: driverId,
      status: "accepted",
      accepted_at: new Date().toISOString()
    })
    .eq("id", ride_id)
    .select()
    .single();

  // Mark driver as unavailable
  await supabaseAdmin
    .from("drivers")
    .update({ is_available: false })
    .eq("user_id", driverId);

  // Notify rider
  await supabaseAdmin.from("notifications").insert({
    user_id: ride.rider_id,
    actor_id: driverId,
    type: "ride_accepted",
    post_id: ride_id,
    is_read: false
  });

  return {
    success: true,
    ride: {
      id: updatedRide.id,
      status: updatedRide.status,
      driver_id: updatedRide.driver_id,
      accepted_at: updatedRide.accepted_at
    },
    message: "Ride accepted successfully."
  };
}

// ============================================================
// ACTION: COMPLETE
// Driver completes the ride
// ============================================================
async function mtaxiComplete(supabaseAdmin, driverId, params) {
  const { ride_id, final_fare, duration_minutes } = params;

  if (!ride_id) {
    throw new Error("Missing ride_id");
  }

  // Get ride
  const { data: ride } = await supabaseAdmin
    .from("rides")
    .select("*, riders:auth.users!rides_rider_id_fkey(id)")
    .eq("id", ride_id)
    .eq("driver_id", driverId)
    .eq("status", "accepted")
    .single();

  if (!ride) throw new Error("Ride not found or not in accepted status");

  const fare = final_fare || ride.estimated_fare;

  // Update ride
  const { data: completedRide } = await supabaseAdmin
    .from("rides")
    .update({
      status: "completed",
      final_fare: fare,
      duration_minutes: duration_minutes,
      completed_at: new Date().toISOString()
    })
    .eq("id", ride_id)
    .select()
    .single();

  // Mark driver available again
  await supabaseAdmin
    .from("drivers")
    .update({ is_available: true })
    .eq("user_id", driverId);

  // Process payment (debit rider, credit driver)
  // Get rider wallet
  const { data: riderWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", ride.rider_id)
    .eq("wallet_type", "main")
    .single();

  if (riderWallet && riderWallet.available_balance >= fare) {
    // Get MTAA fee
    const { data: feeConfig } = await supabaseAdmin
      .from("platform_fees")
      .select("percentage")
      .eq("module", "mtaxi")
      .eq("active", true)
      .maybeSingle();

    const feePercentage = feeConfig?.percentage || 15.0; // 15% platform fee for rides
    const mtaaFee = Math.round(fare * (feePercentage / 100) * 100) / 100;
    const driverEarnings = fare - mtaaFee;

    // Debit rider
    await supabaseAdmin
      .from("wallets")
      .update({ available_balance: riderWallet.available_balance - fare })
      .eq("id", riderWallet.id);

    // Credit driver
    const { data: driverWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, available_balance")
      .eq("user_id", driverId)
      .eq("wallet_type", "main")
      .single();

    if (driverWallet) {
      await supabaseAdmin
        .from("wallets")
        .update({ available_balance: driverWallet.available_balance + driverEarnings })
        .eq("id", driverWallet.id);
    }

    // Record transactions
    const transactionRef = `MTX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await supabaseAdmin.from("wallet_transactions").insert([
      {
        wallet_id: riderWallet.id,
        user_id: ride.rider_id,
        transaction_type: "ride_payment",
        direction: "debit",
        amount: fare,
        net_amount: -fare,
        status: "completed",
        metadata: { ride_id, driver_id: driverId, transaction_ref: transactionRef }
      },
      {
        wallet_id: driverWallet?.id,
        user_id: driverId,
        transaction_type: "ride_earnings",
        direction: "credit",
        amount: driverEarnings,
        net_amount: driverEarnings,
        status: "completed",
        metadata: { ride_id, rider_id: ride.rider_id, transaction_ref: transactionRef, mtaa_fee: mtaaFee }
      }
    ]);

    // Record creator earnings for driver
    await supabaseAdmin.from("creator_earnings").insert({
      user_id: driverId,
      source_id: ride_id,
      source_module: "mtaxi",
      source_table: "rides",
      earning_type: "job_payment",
      gross_amount: fare,
      platform_fee: mtaaFee,
      net_amount: driverEarnings,
      currency: "KES",
      status: "credited"
    });
  }

  // Notify rider
  await supabaseAdmin.from("notifications").insert({
    user_id: ride.rider_id,
    actor_id: driverId,
    type: "ride_completed",
    post_id: ride_id,
    is_read: false
  });

  return {
    success: true,
    ride: {
      id: completedRide.id,
      status: completedRide.status,
      final_fare: completedRide.final_fare,
      completed_at: completedRide.completed_at
    },
    message: `Ride completed. Fare: KES ${fare}.`
  };
}

// ============================================================
// ACTION: CANCEL
// Cancel a ride
// ============================================================
async function mtaxiCancel(supabaseAdmin, userId, params) {
  const { ride_id, reason } = params;

  if (!ride_id) {
    throw new Error("Missing ride_id");
  }

  // Get ride
  const { data: ride } = await supabaseAdmin
    .from("rides")
    .select("*")
    .eq("id", ride_id)
    .single();

  if (!ride) throw new Error("Ride not found");
  if (ride.status === "completed") {
    throw new Error("Cannot cancel a completed ride");
  }

  // Verify user is rider or driver
  if (ride.rider_id !== userId && ride.driver_id !== userId) {
    throw new Error("Unauthorized to cancel this ride");
  }

  const wasAccepted = ride.status === "accepted";

  // Update ride
  await supabaseAdmin
    .from("rides")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      cancelled_by: userId
    })
    .eq("id", ride_id);

  // If driver had accepted, make them available again
  if (wasAccepted && ride.driver_id) {
    await supabaseAdmin
      .from("drivers")
      .update({ is_available: true })
      .eq("user_id", ride.driver_id);
  }

  // Notify other party
  const notifyUserId = ride.rider_id === userId ? ride.driver_id : ride.rider_id;
  if (notifyUserId) {
    await supabaseAdmin.from("notifications").insert({
      user_id: notifyUserId,
      actor_id: userId,
      type: "ride_cancelled",
      post_id: ride_id,
      is_read: false
    });
  }

  return {
    success: true,
    ride_id: ride_id,
    status: "cancelled",
    message: "Ride cancelled successfully."
  };
}

// ============================================================
// ACTION: ONBOARD_VEHICLE
// Driver registers a new vehicle
// ============================================================
async function mtaxiOnboardVehicle(supabaseAdmin, driverId, params) {
  const { plate_number, make, model, year, color, capacity, vehicle_type = "taxi" } = params;

  if (!plate_number || !make || !model) {
    throw new Error("Missing required vehicle details");
  }

  // Check if vehicle already exists
  const { data: existingVehicle } = await supabaseAdmin
    .from("vehicles")
    .select("id")
    .eq("plate_number", plate_number)
    .single();

  if (existingVehicle) {
    throw new Error("Vehicle with this plate number already registered");
  }

  // Create vehicle
  const { data: vehicle } = await supabaseAdmin
    .from("vehicles")
    .insert({
      owner_id: driverId,
      plate_number: plate_number,
      make: make,
      model: model,
      year: year,
      color: color,
      type: vehicle_type,
      status: "pending",
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // Create driver record if not exists
  const { data: existingDriver } = await supabaseAdmin
    .from("drivers")
    .select("user_id")
    .eq("user_id", driverId)
    .single();

  if (!existingDriver) {
    await supabaseAdmin.from("drivers").insert({
      user_id: driverId,
      vehicle_type: vehicle_type,
      verified: false,
      is_available: false
    });
  }

  return {
    success: true,
    vehicle: {
      id: vehicle.id,
      plate_number: vehicle.plate_number,
      make: vehicle.make,
      model: vehicle.model,
      status: vehicle.status
    },
    message: `Vehicle ${plate_number} registered. Pending inspection and approval.`
  };
}

// ============================================================
// ACTION: INSPECTION_PAYMENT
// Driver pays for vehicle inspection
// ============================================================
async function mtaxiInspectionPayment(supabaseAdmin, driverId, params) {
  const { vehicle_id, inspection_type = "standard" } = params;

  if (!vehicle_id) {
    throw new Error("Missing vehicle_id");
  }

  // Get vehicle
  const { data: vehicle } = await supabaseAdmin
    .from("vehicles")
    .select("*")
    .eq("id", vehicle_id)
    .eq("owner_id", driverId)
    .single();

  if (!vehicle) throw new Error("Vehicle not found");

  const inspectionFee = inspection_type === "premium" ? 2000 : 1000;

  // Get driver wallet
  const { data: driverWallet } = await supabaseAdmin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", driverId)
    .eq("wallet_type", "main")
    .single();

  if (!driverWallet) throw new Error("Wallet not found");
  if (driverWallet.available_balance < inspectionFee) {
    throw new Error(`Insufficient balance. Required: KES ${inspectionFee}`);
  }

  // Debit driver
  await supabaseAdmin
    .from("wallets")
    .update({ available_balance: driverWallet.available_balance - inspectionFee })
    .eq("id", driverWallet.id);

  // Create inspection record
  const { data: inspection } = await supabaseAdmin
    .from("vehicle_inspections")
    .insert({
      vehicle_id: vehicle_id,
      driver_id: driverId,
      inspection_type: inspection_type,
      fee_paid: inspectionFee,
      status: "pending",
      paid_at: new Date().toISOString()
    })
    .select()
    .single();

  // Record transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    wallet_id: driverWallet.id,
    user_id: driverId,
    transaction_type: "inspection_payment",
    direction: "debit",
    amount: inspectionFee,
    net_amount: -inspectionFee,
    status: "completed",
    metadata: { vehicle_id, inspection_id: inspection.id, inspection_type }
  });

  return {
    success: true,
    inspection: {
      id: inspection.id,
      vehicle_id: inspection.vehicle_id,
      fee_paid: inspection.fee_paid,
      status: inspection.status
    },
    message: `Inspection payment of KES ${inspectionFee} successful. Inspection scheduled.`
  };
}

// ============================================================
// ACTION: INSPECTION_COMPLETE
// Inspector completes vehicle inspection
// ============================================================
async function mtaxiInspectionComplete(supabaseAdmin, inspectorId, params) {
  const { inspection_id, passed, notes, issues } = params;

  if (!inspection_id) {
    throw new Error("Missing inspection_id");
  }

  // Verify inspector is admin/staff
  const { data: inspector } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", inspectorId)
    .in("role", ["admin", "inspector"])
    .single();

  if (!inspector) {
    throw new Error("Only inspectors can complete inspections");
  }

  // Get inspection
  const { data: inspection } = await supabaseAdmin
    .from("vehicle_inspections")
    .select("*, vehicles(id, owner_id, plate_number)")
    .eq("id", inspection_id)
    .single();

  if (!inspection) throw new Error("Inspection not found");

  // Update inspection
  const { data: updatedInspection } = await supabaseAdmin
    .from("vehicle_inspections")
    .update({
      status: passed ? "passed" : "failed",
      completed_at: new Date().toISOString(),
      inspector_id: inspectorId,
      notes: notes,
      issues: issues || []
    })
    .eq("id", inspection_id)
    .select()
    .single();

  // Update vehicle status
  await supabaseAdmin
    .from("vehicles")
    .update({
      inspection_status: passed ? "inspected" : "failed",
      status: passed ? "under_review" : "rejected"
    })
    .eq("id", inspection.vehicle_id);

  // Notify driver
  await supabaseAdmin.from("notifications").insert({
    user_id: inspection.vehicles.owner_id,
    actor_id: inspectorId,
    type: passed ? "inspection_passed" : "inspection_failed",
    post_id: inspection_id,
    is_read: false
  });

  return {
    success: true,
    inspection: {
      id: updatedInspection.id,
      status: updatedInspection.status,
      vehicle_id: updatedInspection.vehicle_id,
      passed: passed
    },
    message: passed 
      ? `Inspection passed. Vehicle ${inspection.vehicles.plate_number} approved for review.`
      : `Inspection failed. Issues: ${issues?.join(", ") || "See notes"}.`
  };
}

// ============================================================
// ACTION: VEHICLE_APPROVAL
// Admin approves vehicle for service
// ============================================================
async function mtaxiVehicleApproval(supabaseAdmin, adminId, params) {
  const { vehicle_id, approved, reason } = params;

  if (!vehicle_id) {
    throw new Error("Missing vehicle_id");
  }

  // Verify admin
  const { data: admin } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", adminId)
    .in("role", ["admin", "supervisor"])
    .single();

  if (!admin) {
    throw new Error("Only admins can approve vehicles");
  }

  // Get vehicle
  const { data: vehicle } = await supabaseAdmin
    .from("vehicles")
    .select("*, drivers(user_id)")
    .eq("id", vehicle_id)
    .single();

  if (!vehicle) throw new Error("Vehicle not found");

  if (approved) {
    // Approve vehicle
    await supabaseAdmin
      .from("vehicles")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: adminId
      })
      .eq("id", vehicle_id);

    // Verify driver
    if (vehicle.drivers?.user_id) {
      await supabaseAdmin
        .from("drivers")
        .update({ verified: true, is_available: true })
        .eq("user_id", vehicle.drivers.user_id);
    }
  } else {
    // Reject vehicle
    await supabaseAdmin
      .from("vehicles")
      .update({
        status: "rejected",
        rejection_reason: reason
      })
      .eq("id", vehicle_id);
  }

  // Notify driver
  await supabaseAdmin.from("notifications").insert({
    user_id: vehicle.owner_id,
    actor_id: adminId,
    type: approved ? "vehicle_approved" : "vehicle_rejected",
    post_id: vehicle_id,
    is_read: false
  });

  return {
    success: true,
    vehicle_id: vehicle_id,
    status: approved ? "approved" : "rejected",
    message: approved 
      ? `Vehicle ${vehicle.plate_number} approved for service.`
      : `Vehicle ${vehicle.plate_number} rejected. Reason: ${reason || "N/A"}.`
  };
}

// ============================================================
// HELPER: Calculate distance between two coordinates (Haversine)
// ============================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100) / 100;
}
