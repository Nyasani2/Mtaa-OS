import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

function isWeb(): boolean {
  return Platform.OS === 'web';
}

export function useLocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const watchRef = useRef<number | null>(null);

  // Check permission status without triggering prompt
  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (!isWeb()) {
      try {
        const { getForegroundPermissionsAsync } = await import('expo-location');
        const { status } = await getForegroundPermissionsAsync();
        const state = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'prompt';
        setPermissionState(state);
        return state;
      } catch {
        setPermissionState('unknown');
        return 'unknown';
      }
    }

    // Web — check navigator.permissions API (Chrome/Edge)
    try {
      if ('permissions' in navigator) {
        const result = await (navigator as any).permissions.query({ name: 'geolocation' });
        const state = result.state as PermissionState;
        setPermissionState(state);
        // Listen for changes
        result.onchange = () => setPermissionState(result.state as PermissionState);
        return state;
      }
    } catch {
      // permissions.query may fail on some browsers for geolocation
    }
    setPermissionState('unknown');
    return 'unknown';
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GeoPosition | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isWeb()) {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            setError('Geolocation not supported by this browser');
            setPermissionState('denied');
            setIsLoading(false);
            resolve(null);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (loc) => {
              const pos: GeoPosition = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: loc.coords.accuracy,
                altitude: loc.coords.altitude,
                heading: loc.coords.heading,
                speed: loc.coords.speed,
                timestamp: loc.timestamp,
              };
              setPosition(pos);
              setPermissionState('granted');
              setIsLoading(false);
              resolve(pos);
            },
            (err) => {
              let msg = 'Location access denied';
              if (err.code === 1) {
                msg = 'Location permission denied. Please allow access in your browser settings.';
                setPermissionState('denied');
              } else if (err.code === 2) {
                msg = 'Location unavailable. Try again or set manually.';
              } else if (err.code === 3) {
                msg = 'Location request timed out. Check your connection.';
              }
              setError(msg);
              setIsLoading(false);
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
          );
        });
      } else {
        // Native
        try {
          const { requestForegroundPermissionsAsync, getCurrentPositionAsync, Accuracy } =
            await import('expo-location');

          const { status } = await requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setError('Location permission denied');
            setPermissionState('denied');
            setIsLoading(false);
            return null;
          }

          const loc = await getCurrentPositionAsync({
            accuracy: Accuracy.BestForNavigation,
          });

          const pos: GeoPosition = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            altitude: loc.coords.altitude,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
          };
          setPosition(pos);
          setPermissionState('granted');
          setIsLoading(false);
          return pos;
        } catch (err: any) {
          setError(err?.message || 'Failed to get location');
          setIsLoading(false);
          return null;
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
      setIsLoading(false);
      return null;
    }
  }, []);

  const startWatching = useCallback(async (intervalMs = 5000) => {
    if (isWeb()) {
      if (!navigator.geolocation) return;
      watchRef.current = navigator.geolocation.watchPosition(
        (loc) => {
          setPosition({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            altitude: loc.coords.altitude,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
          });
        },
        (err) => setError(err?.message || 'Watch error'),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      try {
        const { watchPositionAsync, Accuracy } = await import('expo-location');
        const sub = await watchPositionAsync(
          { accuracy: Accuracy.BestForNavigation, timeInterval: intervalMs, distanceInterval: 10 },
          (loc) => {
            setPosition({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy,
              altitude: loc.coords.altitude,
              heading: loc.coords.heading,
              speed: loc.coords.speed,
              timestamp: loc.timestamp,
            });
          }
        );
        (watchRef as any).current = sub;
      } catch (err: any) {
        setError(err?.message || 'Watch failed');
      }
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (isWeb()) {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    } else {
      if ((watchRef as any).current?.remove) {
        (watchRef as any).current.remove();
        (watchRef as any).current = null;
      }
    }
  }, []);

  useEffect(() => {
    checkPermission();
    return () => stopWatching();
  }, [checkPermission, stopWatching]);

  return {
    position,
    error,
    isLoading,
    permissionState,
    checkPermission,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
}
