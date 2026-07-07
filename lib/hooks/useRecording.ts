import { useState, useCallback } from 'react';
import {
  startRecording,
  stopRecording,
  getRecordings,
  getRecordingById,
  getRecordingsByTrip,
  getRecordingsByDateRange,
  updateRecordingUploadStatus,
  deleteRecording,
  getStorageStats,
  type Recording,
} from '@/lib/services/recording.service';

const QUERY_TIMEOUT = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface UseRecordingState {
  recordings: Recording[];
  currentRecording: Recording | null;
  isLoading: boolean;
  isRecording: boolean;
  error: string | null;
  storageStats: { totalBytes: number; totalGB: number; count: number } | null;
}

export function useRecording() {
  const [state, setState] = useState<UseRecordingState>({
    recordings: [],
    currentRecording: null,
    isLoading: false,
    isRecording: false,
    error: null,
    storageStats: null,
  });

  const loadRecordings = useCallback(async (filters?: Parameters<typeof getRecordings>[0]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getRecordings(filters), QUERY_TIMEOUT, 'loadRecordings');
      setState(prev => ({ ...prev, recordings: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadRecording = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getRecordingById(id), QUERY_TIMEOUT, 'loadRecording');
      setState(prev => ({ ...prev, currentRecording: data, isLoading: false }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const beginRecording = useCallback(async (recordingData: Omit<Recording, 'id' | 'created_at' | 'updated_at' | 'ended_at'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(startRecording(recordingData), QUERY_TIMEOUT, 'beginRecording');
      setState(prev => ({
        ...prev,
        currentRecording: data,
        isRecording: true,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const endRecording = useCallback(async (endData: { ended_at: string; end_lat?: number; end_lng?: number; duration_seconds: number; file_size_bytes?: number }) => {
    if (!state.currentRecording) {
      setState(prev => ({ ...prev, error: 'No active recording' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(stopRecording(state.currentRecording.id, endData), QUERY_TIMEOUT, 'endRecording');
      setState(prev => ({
        ...prev,
        currentRecording: data,
        isRecording: false,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, [state.currentRecording]);

  const loadTripRecordings = useCallback(async (tripId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getRecordingsByTrip(tripId), QUERY_TIMEOUT, 'loadTripRecordings');
      setState(prev => ({ ...prev, recordings: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadDateRangeRecordings = useCallback(async (startDate: string, endDate: string, driverId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getRecordingsByDateRange(startDate, endDate, driverId), QUERY_TIMEOUT, 'loadDateRangeRecordings');
      setState(prev => ({ ...prev, recordings: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const markUploaded = useCallback(async (recordingId: string, storagePath: string) => {
    try {
      const data = await withTimeout(updateRecordingUploadStatus(recordingId, 'uploaded', storagePath), QUERY_TIMEOUT, 'markUploaded');
      setState(prev => ({
        ...prev,
        recordings: prev.recordings.map(r => r.id === recordingId ? data : r),
        currentRecording: prev.currentRecording?.id === recordingId ? data : prev.currentRecording,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      return null;
    }
  }, []);

  const removeRecording = useCallback(async (recordingId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await withTimeout(deleteRecording(recordingId), QUERY_TIMEOUT, 'removeRecording');
      setState(prev => ({
        ...prev,
        recordings: prev.recordings.filter(r => r.id !== recordingId),
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadStorageStats = useCallback(async (driverId?: string) => {
    try {
      const stats = await withTimeout(getStorageStats(driverId), QUERY_TIMEOUT, 'loadStorageStats');
      setState(prev => ({ ...prev, storageStats: stats }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadRecordings,
    loadRecording,
    beginRecording,
    endRecording,
    loadTripRecordings,
    loadDateRangeRecordings,
    markUploaded,
    removeRecording,
    loadStorageStats,
    clearError,
  };
}
