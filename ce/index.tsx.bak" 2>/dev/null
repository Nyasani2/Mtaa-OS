import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { doctorService } from '@/lib/health/services/doctor.service';

// ─── Doctor Dashboard Hook ───
export function useDoctorDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [s, a, o] = await Promise.all([
      doctorService.getStats(user.id),
      doctorService.getTodayAppointments(user.id),
      doctorService.getPendingOrders(user.id),
    ]);
    setStats(s);
    setTodayAppointments(a);
    setPendingOrders(o);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return { stats, todayAppointments, pendingOrders, loading, refetch: fetchDashboard };
}

// ─── Prescribe Hook ───
export function useDoctorPrescribe() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [p, i] = await Promise.all([
      doctorService.getActivePatients(),
      doctorService.getPharmacyInventory(),
    ]);
    setPatients(p);
    setInventory(i);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createPrescription = async (data: any) => {
    if (!user) return;
    setIsCreating(true);
    const result = await doctorService.createPrescription({ ...data, doctor_id: user.id });
    setIsCreating(false);
    return result;
  };

  return { patients, inventory, loading, isCreating, createPrescription, refetch: fetchData };
}

// ─── Orders Hook ───
export function useDoctorOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [o, p] = await Promise.all([
      doctorService.getOrders(user.id),
      doctorService.getActivePatients(),
    ]);
    setOrders(o);
    setPatients(p);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createOrder = async (data: any) => {
    if (!user) return;
    setIsCreating(true);
    const result = await doctorService.createOrder({ ...data, doctor_id: user.id });
    setIsCreating(false);
    await fetchData();
    return result;
  };

  const cancelOrder = async (orderId: string) => {
    await doctorService.cancelOrder(orderId);
    await fetchData();
  };

  return { orders, patients, loading, isCreating, createOrder, cancelOrder, refetch: fetchData };
}

// ─── Follow-ups Hook ───
export function useDoctorFollowUps() {
  const { user } = useAuthStore();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [f, p] = await Promise.all([
      doctorService.getFollowUps(user.id),
      doctorService.getActivePatients(),
    ]);
    setFollowUps(f);
    setPatients(p);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createFollowUp = async (data: any) => {
    if (!user) return;
    setIsCreating(true);
    const result = await doctorService.createFollowUp({ ...data, doctor_id: user.id });
    setIsCreating(false);
    await fetchData();
    return result;
  };

  const completeFollowUp = async (id: string) => {
    await doctorService.completeFollowUp(id);
    await fetchData();
  };

  return { followUps, patients, loading, isCreating, createFollowUp, completeFollowUp, refetch: fetchData };
}

// ─── Lab Orders Hook ───
export function useDoctorLabOrders() {
  const { user } = useAuthStore();
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [l, p, t] = await Promise.all([
      doctorService.getLabOrders(user.id),
      doctorService.getActivePatients(),
      doctorService.getLabTests(),
    ]);
    setLabOrders(l);
    setPatients(p);
    setTests(t);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createLabOrder = async (data: any) => {
    if (!user) return;
    setIsCreating(true);
    const result = await doctorService.createLabOrder({ ...data, doctor_id: user.id });
    setIsCreating(false);
    await fetchData();
    return result;
  };

  return { labOrders, patients, tests, loading, isCreating, createLabOrder, refetch: fetchData };
}

// ─── Notes Hook ───
export function useDoctorNotes() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [n, p] = await Promise.all([
      doctorService.getNotes(user.id),
      doctorService.getActivePatients(),
    ]);
    setNotes(n);
    setPatients(p);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createNote = async (data: any) => {
    if (!user) return;
    setIsCreating(true);
    const result = await doctorService.createNote({ ...data, doctor_id: user.id });
    setIsCreating(false);
    await fetchData();
    return result;
  };

  const signNote = async (noteId: string) => {
    if (!user) return;
    setIsSigning(true);
    await doctorService.signNote(noteId, user.id);
    setIsSigning(false);
    await fetchData();
  };

  return { notes, patients, loading, isCreating, isSigning, createNote, signNote, refetch: fetchData };
}
