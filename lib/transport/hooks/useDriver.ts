import { useState, useCallback, useEffect } from 'react';
import {
  getDriverProfile,
  getDriverByUserId,
  updateDriverOnlineStatus,
  findNearbyRideRequests,
  acceptRide,
  updateRideStatus,
  getDriverRides,
  getDriverEarnings,
  getDriverWalletBalance,
  haversine,
} from '../services/ride.service';
import { sendPushToUser, createInAppNotification } from '../services/push.service';

export function useDriver() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);

  const loadDriverProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getDriverByUserId(userId);
      setDriverProfile(profile);
      return profile;
    } catch (err: any) {
      setError(err.message || 'Failed to load driver profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleOnline = useCallback(async (driverId: string, isOnline: boolean, lat?: number, lng?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateDriverOnlineStatus(driverId, isOnline, lat, lng);
      setDriverProfile((prev: any) => prev ? { ...prev, is_online: isOnline } : prev);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNearbyRequests = useCallback(async (lat: number, lng: number, radiusKm?: number) => {
    setLoading(true);
    setError(null);
    try {
      const requests = await findNearbyRideRequests(lat, lng, radiusKm);
      return requests;
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRideRequest = useCallback(async (rideId: string, driverId: string, passengerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await acceptRide(rideId, driverId);
      // Notify passenger
      try {
        await sendPushToUser(passengerId, 'Driver Found!', 'A driver has accepted your ride request.', { ride_id: rideId, type: 'ride_accepted' });
        await createInAppNotification(passengerId, 'Driver Found!', 'A driver has accepted your ride request.', { ride_id: rideId, type: 'ride_accepted' });
      } catch { /* push fail is non-critical */ }
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to accept ride');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (rideId: string, status: string, passengerId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateRideStatus(rideId, status);
      // Notify passenger on status changes
      if (passengerId) {
        const titles: Record<string, string> = {
          arrived: 'Driver has arrived!',
          started: 'Trip started',
          completed: 'Trip completed — thank you!',
        };
        const bodies: Record<string, string> = {
          arrived: 'Your driver is at the pickup location.',
          started: 'You are on your way to the destination.',
          completed: 'Your trip is complete. Rate your driver!',
        };
        if (titles[status]) {
          try {
            await sendPushToUser(passengerId, titles[status], bodies[status], { ride_id: rideId, type: `ride_${status}` });
            await createInAppNotification(passengerId, titles[status], bodies[status], { ride_id: rideId, type: `ride_${status}` });
          } catch { /* ignore */ }
        }
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDriverRides = useCallback(async (driverId: string) => {
    setLoading(true);
    setError(null);
    try {
      const rides = await getDriverRides(driverId);
      return rides;
    } catch (err: any) {
      setError(err.message || 'Failed to load rides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEarnings = useCallback(async (driverId: string, period: 'today' | 'week' | 'month' = 'today') => {
    setLoading(true);
    setError(null);
    try {
      const earnings = await getDriverEarnings(driverId, period);
      return earnings;
    } catch (err: any) {
      setError(err.message || 'Failed to load earnings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWalletBalance = useCallback(async (driverUserId: string) => {
    try {
      const bal = await getDriverWalletBalance(driverUserId);
      return bal;
    } catch {
      return { balance: 0, available_balance: 0, currency: 'KES' };
    }
  }, []);

  return {
    loading,
    error,
    driverProfile,
    loadDriverProfile,
    toggleOnline,
    loadNearbyRequests,
    acceptRideRequest,
    updateStatus,
    loadDriverRides,
    loadEarnings,
    loadWalletBalance,
  };
}
