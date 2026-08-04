import { useState, useCallback } from 'react';
import {
  createRide,
  getPassengerRides,
  getRideById,
  findNearbyDrivers,
  getWalletBalance,
  calculateFare,
  estimateMinutes,
  haversine,
} from '../services/ride.service';
import { cancelRide, cancelRideDirect } from '../services/cancel.service';
import { CreateRidePayload, NearbyDriver } from '../types';

export function useTransport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewRide = useCallback(async (payload: CreateRidePayload) => {
    setLoading(true);
    setError(null);
    try {
      const ride = await createRide(payload);
      return ride;
    } catch (err: any) {
      setError(err.message || 'Failed to create ride');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRideHistory = useCallback(async (passengerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const rides = await getPassengerRides(passengerId);
      return rides;
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActiveRide = useCallback(async (rideId: string) => {
    setLoading(true);
    setError(null);
    try {
      const ride = await getRideById(rideId);
      return ride;
    } catch (err: any) {
      setError(err.message || 'Failed to load ride');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const findDrivers = useCallback(async (lat: number, lng: number, radiusKm?: number) => {
    setLoading(true);
    setError(null);
    try {
      const drivers = await findNearbyDrivers(lat, lng, radiusKm);
      return drivers;
    } catch (err: any) {
      setError(err.message || 'Failed to find drivers');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWalletBalance = useCallback(async (userId: string) => {
    try {
      const bal = await getWalletBalance(userId);
      return bal;
    } catch {
      return { balance: 0, available_balance: 0, currency: 'KES' };
    }
  }, []);

  const cancelRideBooking = useCallback(async (rideId: string, cancelledBy: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      try {
        result = await cancelRide(rideId, cancelledBy, reason);
      } catch {
        result = await cancelRideDirect(rideId, cancelledBy, reason);
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to cancel ride');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createNewRide,
    loadRideHistory,
    loadActiveRide,
    findDrivers,
    loadWalletBalance,
    cancelRideBooking,
    calculateFare,
    estimateMinutes,
    haversine,
  };
}
