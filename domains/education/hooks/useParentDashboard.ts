import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Child {
  id: string;
  full_name: string;
  current_level: string;
  institution_id: string;
  institution_name: string;
  status: 'at_school' | 'on_bus' | 'at_home';
}

export interface BusETA {
  route_name: string;
  minutes: number;
  stops_away: number;
  driver_name: string;
  vehicle_reg: string;
}

export interface ParentStats {
  attendance_rate: number;
  avg_grade: number;
  pending_fees: number;
}

export function useParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [busETA, setBusETA] = useState<BusETA | null>(null);
  const [busStatus, setBusStatus] = useState<string | null>(null);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) { setLoading(false); return; }

      // Get parent record
      const { data: parent } = await supabase
        .from('education_parent_guardians')
        .select('id, student_ids')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!parent || !parent.student_ids?.length) { setLoading(false); return; }

      // Fetch all children
      const { data: students } = await supabase
        .from('education_students')
        .select('id, full_name, current_level, institution_id, enrollment_status, institution:institution_id(name)')
        .in('id', parent.student_ids)
        .eq('enrollment_status', 'active');

      const mappedChildren: Child[] = (students || []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        current_level: s.current_level || 'Unknown',
        institution_id: s.institution_id,
        institution_name: s.institution?.name || 'Unknown School',
        status: 'at_school', // Would need real-time status
      }));

      setChildren(mappedChildren);
      if (mappedChildren.length > 0 && !selectedChild) {
        setSelectedChild(mappedChildren[0]);
      }

      const activeChild = selectedChild || mappedChildren[0];
      if (!activeChild) { setLoading(false); return; }

      // Fetch child-specific data
      const today = new Date().toISOString().split('T')[0];

      const [
        { data: attendance },
        { data: grades },
        { data: transport },
        { data: messages },
      ] = await Promise.all([
        supabase.from('education_attendance').select('status, date')
          .eq('student_id', activeChild.id)
          .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .order('date', { ascending: false }),

        supabase.from('education_grades').select('id, score, subject_name, assessment_type, created_at')
          .eq('student_id', activeChild.id)
          .order('created_at', { ascending: false })
          .limit(5),

        supabase.from('education_transport_assignments').select(`
          route:route_id(name),
          vehicle:vehicle_id(registration, driver_name),
          eta_minutes, stops_away
        `)
          .eq('student_id', activeChild.id)
          .eq('status', 'active')
          .single(),

        supabase.from('education_messages').select('id', { count: 'exact' })
          .eq('recipient_id', userId)
          .eq('read', false),
      ]);

      // Stats
      const totalAtt = attendance?.length || 0;
      const present = attendance?.filter((a: any) => a.status === 'present').length || 0;
      const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0;

      const scores = (grades || []).map((g: any) => g.score).filter((s: number) => typeof s === 'number');
      const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

      setStats({ attendance_rate: attRate, avg_grade: avg, pending_fees: 0 });
      setRecentGrades(grades || []);

      // Weekly attendance dots
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekAtt = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayAtt = attendance?.find((a: any) => a.date === dayStr);
        weekAtt.push({ day: days[d.getDay()].charAt(0), status: dayAtt?.status || 'unknown' });
      }
      setRecentAttendance(weekAtt);

      // Bus ETA
      if (transport) {
        setBusETA({
          route_name: transport.route?.name || 'Route',
          minutes: transport.eta_minutes || 0,
          stops_away: transport.stops_away || 0,
          driver_name: transport.vehicle?.driver_name || 'Unknown',
          vehicle_reg: transport.vehicle?.registration || '',
        });
        setBusStatus(transport.eta_minutes && transport.eta_minutes <= 5 ? 'approaching' : 'en_route');
      }

      setUnreadMessages(messages?.length || 0);
    } catch (e) {
      console.error('useParentDashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedChild?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const selectChild = useCallback((childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) setSelectedChild(child);
  }, [children]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    children, selectedChild, selectChild,
    stats, busETA, busStatus,
    recentGrades, recentAttendance,
    loading, refreshing, refresh,
    unreadMessages,
  };
}
