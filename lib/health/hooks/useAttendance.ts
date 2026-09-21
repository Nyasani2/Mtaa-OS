// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface AttendanceRecord {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  status: 'clocked_in' | 'clocked_out';
  clock_in_lat: number;
  clock_in_lng: number;
}

export function useAttendance(facilityId: string, facilityLat: number, facilityLng: number, maxDistanceMeters: number = 150) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'clocked_in' | 'clocked_out' | 'loading'>('loading');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  // Haversine formula to calculate distance between GPS coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + 
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const checkCurrentStatus = useCallback(async () => {
    if (!user?.id) {
      setCurrentStatus('clocked_out');
      return;
    }

    setLoading(true);
    try {
      // Get staff ID
      const { data: staff } = await supabase
        .from('health_staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('facility_id', facilityId)
        .maybeSingle();

      if (!staff) {
        setCurrentStatus('clocked_out');
        return;
      }

      // Get today's attendance record
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('health_attendance')
        .select('*')
        .eq('staff_id', staff.id)
        .gte('clock_in_time', today)
        .lt('clock_in_time', new Date(new Date().setDate(new Date().getDate() + 1)).toISOString())
        .order('clock_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTodayRecord(data);
        setCurrentStatus(data.status as 'clocked_in' | 'clocked_out');
      } else {
        setCurrentStatus('clocked_out');
      }
    } catch (err: any) {
      console.error('Failed to check attendance status', err);
      setError('Failed to load attendance status');
    } finally {
      setLoading(false);
    }
  }, [user?.id, facilityId]);

  useEffect(() => {
    checkCurrentStatus();
  }, [checkCurrentStatus]);

  const clockIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request Location Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required to clock in. Please enable it in settings.');
      }

      // 2. Get Current Location
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      const { latitude, longitude } = location.coords;

      // 3. Verify Geofence
      const distance = calculateDistance(latitude, longitude, facilityLat, facilityLng);
      if (distance > maxDistanceMeters) {
        throw new Error(
          `You are ${Math.round(distance)}m away from the facility. ` +
          `Please clock in within ${maxDistanceMeters}m of the hospital.`
        );
      }

      // 4. Get Staff ID
      const { data: staff } = await supabase
        .from('health_staff')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!staff) throw new Error('Staff profile not found. Please contact admin.');

      // 5. Check if already clocked in
      if (currentStatus === 'clocked_in') {
        throw new Error('You are already clocked in!');
      }

      // 6. Record Clock-In
      const { error: dbError } = await supabase
        .from('health_attendance')
        .insert({
          staff_id: staff.id,
          facility_id: facilityId,
          clock_in_lat: latitude,
          clock_in_lng: longitude,
          status: 'clocked_in',
          notes: `Clocked in from mobile device`,
        });

      if (dbError) throw dbError;

      await checkCurrentStatus();
      return { success: true, message: '✅ Clocked in successfully!' };
    } catch (err: any) {
      setError(err.message || 'Failed to clock in');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, facilityId, facilityLat, facilityLng, maxDistanceMeters, currentStatus, checkCurrentStatus]);

  const clockOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request Location Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required to clock out.');
      }

      // 2. Get Current Location
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.High 
      });
      const { latitude, longitude } = location.coords;

      // 3. Verify Geofence
      const distance = calculateDistance(latitude, longitude, facilityLat, facilityLng);
      if (distance > maxDistanceMeters) {
        throw new Error(
          `You are ${Math.round(distance)}m away from the facility. ` +
          `Please clock out within ${maxDistanceMeters}m of the hospital.`
        );
      }

      // 4. Get Staff ID
      const { data: staff } = await supabase
        .from('health_staff')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!staff) throw new Error('Staff profile not found.');

      // 5. Update the most recent 'clocked_in' record
      const { error: dbError } = await supabase
        .from('health_attendance')
        .update({ 
          clock_out_time: new Date().toISOString(),
          clock_out_lat: latitude,
          clock_out_lng: longitude,
          status: 'clocked_out'
        })
        .eq('staff_id', staff.id)
        .eq('status', 'clocked_in')
        .order('clock_in_time', { ascending: false })
        .limit(1)
        .select()
        .single();

      if (dbError) throw dbError;

      await checkCurrentStatus();
      return { success: true, message: '✅ Clocked out successfully!' };
    } catch (err: any) {
      setError(err.message || 'Failed to clock out');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [user?.id, facilityId, facilityLat, facilityLng, maxDistanceMeters, checkCurrentStatus]);

  return { 
    currentStatus, 
    loading, 
    error, 
    clockIn, 
    clockOut, 
    todayRecord,
    distance: todayRecord ? calculateDistance(
      todayRecord.clock_in_lat, 
      todayRecord.clock_in_lng, 
      facilityLat, 
      facilityLng
    ) : 0
  };
}
