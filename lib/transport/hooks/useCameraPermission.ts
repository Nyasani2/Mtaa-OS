import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Camera } from 'expo-camera';

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
      // Native: Actually check permission using expo-camera
      const { status } = await Camera.getCameraPermissionsAsync();
      const state = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'prompt';
      setPermissionState(state);
      return state;
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
        // Native: Actually request permission using expo-camera
        const { status } = await Camera.requestCameraPermissionsAsync();
        const state = status === 'granted' ? 'granted' : 'denied';
        setPermissionState(state);
        setIsLoading(false);
        return status === 'granted';
      }
    } catch (err: any) {
      setPermissionState('denied');
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
