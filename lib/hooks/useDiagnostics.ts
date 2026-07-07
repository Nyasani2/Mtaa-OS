import { useState, useCallback } from 'react';
import {
  createDiagnosticSession,
  getDiagnosticSessions,
  getDiagnosticSession,
  updateDiagnosticSession,
  scanFaultCodes,
  clearFaultCodes,
  readLiveData,
  requestAsisAnalysis,
  programVehicle,
  generateDiagnosticReport,
  shareDiagnosticWithCustomer,
  getVehicleCapabilities,
  OBD_PROTOCOLS,
  PROGRAMMING_CAPABILITIES,
  type DiagnosticSession,
  type FaultCode,
  type ProgrammingOperation,
} from '@/lib/services/diagnostics.service';

const QUERY_TIMEOUT = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export interface UseDiagnosticsState {
  sessions: DiagnosticSession[];
  currentSession: DiagnosticSession | null;
  isLoading: boolean;
  isScanning: boolean;
  isAnalyzing: boolean;
  error: string | null;
  obdProtocols: typeof OBD_PROTOCOLS;
  programmingCapabilities: typeof PROGRAMMING_CAPABILITIES;
}

export function useDiagnostics() {
  const [state, setState] = useState<UseDiagnosticsState>({
    sessions: [],
    currentSession: null,
    isLoading: false,
    isScanning: false,
    isAnalyzing: false,
    error: null,
    obdProtocols: OBD_PROTOCOLS,
    programmingCapabilities: PROGRAMMING_CAPABILITIES,
  });

  const setLoading = useCallback((flag = true) => {
    setState(prev => ({ ...prev, isLoading: flag, error: null }));
  }, []);

  const setError = useCallback((err: any) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      isScanning: false,
      isAnalyzing: false,
      error: err?.message || String(err),
    }));
  }, []);

  // ─── Create new diagnostic session ───
  const createSession = useCallback(async (sessionData: Omit<DiagnosticSession, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading();
    try {
      const data = await withTimeout(createDiagnosticSession(sessionData), QUERY_TIMEOUT, 'createSession');
      setState(prev => ({
        ...prev,
        sessions: [data, ...prev.sessions],
        currentSession: data,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Load all sessions for a garage ───
  const loadSessions = useCallback(async (garageId: string, filters?: { vehicle_id?: string; mechanic_id?: string; limit?: number }) => {
    setLoading();
    try {
      const data = await withTimeout(getDiagnosticSessions(garageId, filters), QUERY_TIMEOUT, 'loadSessions');
      setState(prev => ({
        ...prev,
        sessions: data,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      setError(err);
    }
  }, []);

  // ─── Load single session ───
  const loadSession = useCallback(async (id: string) => {
    setLoading();
    try {
      const data = await withTimeout(getDiagnosticSession(id), QUERY_TIMEOUT, 'loadSession');
      setState(prev => ({
        ...prev,
        currentSession: data,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Update session ───
  const updateSession = useCallback(async (id: string, updates: Partial<DiagnosticSession>) => {
    try {
      const data = await withTimeout(updateDiagnosticSession(id, updates), QUERY_TIMEOUT, 'updateSession');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === id ? data : s),
        currentSession: prev.currentSession?.id === id ? data : prev.currentSession,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  // ─── Scan fault codes (OBD-II) ───
  const scanCodes = useCallback(async (sessionId: string, elmDeviceId?: string) => {
    setState(prev => ({ ...prev, isScanning: true, error: null }));
    try {
      const data = await withTimeout(scanFaultCodes(sessionId, elmDeviceId), QUERY_TIMEOUT * 2, 'scanCodes');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        isScanning: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Clear fault codes ───
  const clearCodes = useCallback(async (sessionId: string) => {
    setLoading();
    try {
      const data = await withTimeout(clearFaultCodes(sessionId), QUERY_TIMEOUT, 'clearCodes');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Read live data ───
  const readLive = useCallback(async (sessionId: string, parameters?: string[]) => {
    setLoading();
    try {
      const data = await withTimeout(readLiveData(sessionId, parameters), QUERY_TIMEOUT, 'readLive');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Request ASIS AI analysis ───
  const analyzeWithAsis = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const analysis = await withTimeout(requestAsisAnalysis(sessionId), QUERY_TIMEOUT * 2, 'analyzeWithAsis');
      // Refresh session to get updated asis_analysis
      const data = await withTimeout(getDiagnosticSession(sessionId), QUERY_TIMEOUT, 'refreshSession');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        isAnalyzing: false,
        error: null,
      }));
      return analysis;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Program vehicle ───
  const program = useCallback(async (sessionId: string, operation: ProgrammingOperation['operation'], params?: Record<string, any>) => {
    setLoading();
    try {
      const data = await withTimeout(programVehicle(sessionId, operation, params), QUERY_TIMEOUT * 2, 'program');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Generate diagnostic report ───
  const generateReport = useCallback(async (sessionId: string) => {
    setLoading();
    try {
      const data = await withTimeout(generateDiagnosticReport(sessionId), QUERY_TIMEOUT, 'generateReport');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }, []);

  // ─── Share with customer ───
  const shareWithCustomer = useCallback(async (sessionId: string) => {
    try {
      const data = await withTimeout(shareDiagnosticWithCustomer(sessionId), QUERY_TIMEOUT, 'shareWithCustomer');
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === sessionId ? data : s),
        currentSession: prev.currentSession?.id === sessionId ? data : prev.currentSession,
        error: null,
      }));
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message }));
      return null;
    }
  }, []);

  // ─── Get vehicle capabilities ───
  const getCapabilities = useCallback((make?: string, model?: string, year?: number) => {
    return getVehicleCapabilities(make, model, year);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createSession,
    loadSessions,
    loadSession,
    updateSession,
    scanCodes,
    clearCodes,
    readLive,
    analyzeWithAsis,
    program,
    generateReport,
    shareWithCustomer,
    getCapabilities,
    clearError,
  };
}
