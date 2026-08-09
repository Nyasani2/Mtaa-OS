import { supabase } from '@/lib/supabase';

export interface AttendanceRecord {
  id: string;
  lesson_id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: string;
  marked_by: string;
  notes: string;
  created_at: string;
}

export async function getAttendance(filters: {
  class_id?: string;
  student_id?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_attendance')
      .select('*')
      .order('date', { ascending: false });

    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.date) query = query.eq('date', filters.date);
    if (filters?.date_from) query = query.gte('date', filters.date_from);
    if (filters?.date_to) query = query.lte('date', filters.date_to);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as AttendanceRecord[], error: null };
  } catch (error: any) {
    console.error('getAttendance error:', error);
    return { data: [], error };
  }
}

export async function getAttendanceSummary(classId: string, dateFrom: string, dateTo: string) {
  try {
    const { data, error } = await supabase
      .from('education_attendance')
      .select('*')
      .eq('class_id', classId)
      .gte('date', dateFrom)
      .lte('date', dateTo);
    if (error) throw error;
    if (!data?.length) return { data: { present: 0, absent: 0, late: 0, total: 0 }, error: null };

    const summary = data.reduce((acc: any, record: AttendanceRecord) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      acc.total += 1;
      return acc;
    }, { present: 0, absent: 0, late: 0, total: 0 });

    return { data: summary, error: null };
  } catch (error: any) {
    console.error('getAttendanceSummary error:', error);
    return { data: null, error };
  }
}

export async function markAttendance(records: Partial<AttendanceRecord>[]) {
  try {
    const { data, error } = await supabase
      .from('education_attendance')
      .upsert(records, { onConflict: 'student_id,date' })
      .select();
    if (error) throw error;
    return { data: (data || []) as AttendanceRecord[], error: null };
  } catch (error: any) {
    console.error('markAttendance error:', error);
    return { data: [], error };
  }
}

export async function markSingleAttendance(record: Partial<AttendanceRecord>) {
  try {
    const { data, error } = await supabase
      .from('education_attendance')
      .upsert([record], { onConflict: 'student_id,date' })
      .select()
      .single();
    if (error) throw error;
    return { data: data as AttendanceRecord, error: null };
  } catch (error: any) {
    console.error('markSingleAttendance error:', error);
    return { data: null, error };
  }
}
