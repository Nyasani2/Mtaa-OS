import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

const DEFAULT = { latitude: -1.2921, longitude: 36.8219, accuracy: null, loading: true, error: null, permissionGranted: false };

export function useLocation() {
  const [state, setState] = useState<LocationState>(DEFAULT);

  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          setState(s => ({ ...s, loading: false, error: 'Location permission denied', permissionGranted: false }));
          return false;
        }
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState(s => ({ ...s, loading: false, error: 'Location permission denied', permissionGranted: false }));
        return false;
      }
      setState(s => ({ ...s, permissionGranted: true }));
      return true;
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message, permissionGranted: false }));
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState({ latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy, loading: false, error: null, permissionGranted: true });
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }));
    }
  }, [requestPermission]);

  useEffect(() => { getCurrentPosition(); }, [getCurrentPosition]);

  return { ...state, refresh: getCurrentPosition, requestPermission };
}
