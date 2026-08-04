import { useState, useCallback } from 'react';
import { Platform } from 'react-native';

export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

export function useCameraPermission() {
  const [permissionState, setPermissionState] = useState<CameraPermissionState>('unknown');
  const [isLoading, setIsLoading] = useState(false);

  const checkPermission = useCallback(async (): Promise<CameraPermissionState> => {
    if (Platform.OS === 'web') {
      try {
        if ('permissions' in navigator) {
          const result = await (navigator as any).permissions.query({ name: 'camera' });
          const state = result.state as CameraPermissionState;
          setPermissionState(state);
          result.onchange = () => setPermissionState(result.state as CameraPermissionState);
          return state;
        }
      } catch {
        // Some browsers don't support camera permission query
      }
      setPermissionState('unknown');
      return 'unknown';
    } else {
      // Native — would use expo-camera or expo-image-picker permissions
      setPermissionState('unknown');
      return 'unknown';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionState('denied');
          setIsLoading(false);
          return false;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop all tracks immediately — we just wanted permission
        stream.getTracks().forEach(track => track.stop());
        setPermissionState('granted');
        setIsLoading(false);
        return true;
      } else {
        // Native — would use expo-camera
        setPermissionState('granted');
        setIsLoading(false);
        return true;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
      } else {
        setPermissionState('denied');
      }
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    permissionState,
    isLoading,
    checkPermission,
    requestPermission,
  };
}
