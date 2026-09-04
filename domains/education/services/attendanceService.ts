// @ts-nocheck
import { supabase } from '@/lib/supabase';import type{Database}from'@/lib/supabase';
type Att=Database['public']['Tables']['education_attendance']['Row'];
export async function getAttendanceSessions(instId:string,date?:string){let q=supabase.from('education_attendance').select('*,class:education_classes(name),teacher:education_teachers(user:user_profiles(full_name))').eq('institution_id',instId).order('session_date',{ascending:false});if(date)q=q.eq('session_date',date);const{d,e}=await q;if(e)throw e;return d||[];}
export async function getStudentAttendance(studentId:string){const{d,e}=await supabase.from('education_attendance').select('*').eq('student_id',studentId).order('session_date',{ascending:false});if(e)throw e;return d||[];}
export async function markAttendance(a:Omit<Att,'id'|'created_at'>){const{d,e}=await supabase.from('education_attendance').insert(a).select().single();if(e)throw e;return d;}
export async function bulkMarkAttendance(records:Omit<Att,'id'|'created_at'>[]){const{d,e}=await supabase.from('education_attendance').insert(records).select();if(e)throw e;return d||[];}
export async function getAttendanceStats(instId:string,date:string){const{d,e}=await supabase.from('education_attendance').select('status').eq('institution_id',instId).eq('session_date',date);if(e)throw e;const all=d||[];return{present:all.filter((x: any) =>x.status==='present').length,absent:all.filter((x: any) =>x.status==='absent').length,late:all.filter((x: any) =>x.status==='late').length,excused:all.filter((x: any) =>x.status==='excused').length,total:all.length};}
