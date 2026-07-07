import { useState, useCallback } from 'react';
import {
  registerDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  assignDevice,
  unassignDevice,
  getDeviceAssignments,
  getVehicleDevices,
  getUserDevices,
  updateDeviceHealth,
  reconnectDevice,
  DEVICE_TYPES,
  CONNECTION_TYPES,
  type Device,
  type DeviceAssignment,
} from '@/lib/services/device.service';

const QUERY_TIMEOUT = 8000; // 8 seconds max

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface UseDeviceManagerState {
  devices: Device[];
  currentDevice: Device | null;
  assignments: DeviceAssignment[];
  vehicleDevices: Device[];
  userDevices: Device[];
  isLoading: boolean;
  error: string | null;
}

export function useDeviceManager() {
  const [state, setState] = useState<UseDeviceManagerState>({
    devices: [],
    currentDevice: null,
    assignments: [],
    vehicleDevices: [],
    userDevices: [],
    isLoading: false,
    error: null,
  });

  const loadDevices = useCallback(async (filters?: Parameters<typeof getDevices>[0]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getDevices(filters), QUERY_TIMEOUT, 'loadDevices');
      setState(prev => ({ ...prev, devices: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadDevice = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getDeviceById(id), QUERY_TIMEOUT, 'loadDevice');
      setState(prev => ({ ...prev, currentDevice: data, isLoading: false }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const createDevice = useCallback(async (deviceData: Omit<Device, 'id' | 'created_at' | 'updated_at'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(registerDevice(deviceData), QUERY_TIMEOUT, 'createDevice');
      setState(prev => ({
        ...prev,
        devices: [data, ...prev.devices],
        currentDevice: data,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const editDevice = useCallback(async (id: string, updates: Partial<Device>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(updateDevice(id, updates), QUERY_TIMEOUT, 'editDevice');
      setState(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.id === id ? data : d),
        currentDevice: prev.currentDevice?.id === id ? data : prev.currentDevice,
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const removeDevice = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await withTimeout(deleteDevice(id), QUERY_TIMEOUT, 'removeDevice');
      setState(prev => ({
        ...prev,
        devices: prev.devices.filter(d => d.id !== id),
        currentDevice: prev.currentDevice?.id === id ? null : prev.currentDevice,
        isLoading: false,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const assign = useCallback(async (assignment: Omit<DeviceAssignment, 'id' | 'assigned_at'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(assignDevice(assignment), QUERY_TIMEOUT, 'assign');
      setState(prev => ({
        ...prev,
        assignments: [data, ...prev.assignments],
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const unassign = useCallback(async (assignmentId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(unassignDevice(assignmentId), QUERY_TIMEOUT, 'unassign');
      setState(prev => ({
        ...prev,
        assignments: prev.assignments.filter(a => a.id !== assignmentId),
        isLoading: false,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return null;
    }
  }, []);

  const loadAssignments = useCallback(async (deviceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getDeviceAssignments(deviceId), QUERY_TIMEOUT, 'loadAssignments');
      setState(prev => ({ ...prev, assignments: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadVehicleDevices = useCallback(async (vehicleId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getVehicleDevices(vehicleId), QUERY_TIMEOUT, 'loadVehicleDevices');
      setState(prev => ({ ...prev, vehicleDevices: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const loadUserDevices = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await withTimeout(getUserDevices(userId), QUERY_TIMEOUT, 'loadUserDevices');
      setState(prev => ({ ...prev, userDevices: data, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, []);

  const setHealth = useCallback(async (deviceId: string, health: string) => {
    try {
      const data = await withTimeout(updateDeviceHealth(deviceId, health), QUERY_TIMEOUT, 'setHealth');
      setState(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.id === deviceId ? data : d),
        currentDevice: prev.currentDevice?.id === deviceId ? data : prev.currentDevice,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      return null;
    }
  }, []);

  const reconnect = useCallback(async (deviceId: string) => {
    try {
      const data = await withTimeout(reconnectDevice(deviceId), QUERY_TIMEOUT, 'reconnect');
      setState(prev => ({
        ...prev,
        devices: prev.devices.map(d => d.id === deviceId ? data : d),
        currentDevice: prev.currentDevice?.id === deviceId ? data : prev.currentDevice,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    deviceTypes: DEVICE_TYPES,
    connectionTypes: CONNECTION_TYPES,
    loadDevices,
    loadDevice,
    createDevice,
    editDevice,
    removeDevice,
    assign,
    unassign,
    loadAssignments,
    loadVehicleDevices,
    loadUserDevices,
    setHealth,
    reconnect,
    clearError,
  };
}
