// lib/mtaxi/index.ts
export { default as RiderHome } from "./components/RiderHome";
export { default as RequestRide } from "./components/RequestRide";
export { default as RideTracking } from "./components/RideTracking";
export { default as RideHistory } from "./components/RideHistory";

// Types — single source of truth
export type {
  MtaxiRide,
  MtaxiDriver,
  CarpoolTrip,
  CarpoolBooking,
  VehicleType,
  RideStatus,
  PaymentMethod,
} from "./types";

// Services — explicit named exports only (no wildcard to avoid FareEstimate conflict)
export { estimateFare, requestRide, getRideById, cancelRide, getMyRides } from "./services/rideService";
export type { FareEstimate } from "./services/rideService";
export { getDriverProfile, toggleOnlineStatus, getPendingRequests, acceptRide, completeRide, updateDriverLocation, getDriverEarnings } from "./services/driverService";
export { getCarpoolTrips, createCarpoolTrip, bookCarpool, getMyCarpoolBookings } from "./services/carpoolService";

// Hooks — explicit named exports only (no wildcard to avoid VehicleType conflict)
export { useRides } from "./hooks/useRides";
export { useDriver } from "./hooks/useDriver";
export { useCarpoolTrips, useCarpoolBookings } from "./hooks/useCarpool";
export { useFareEstimate } from "./hooks/useFareEstimate";
