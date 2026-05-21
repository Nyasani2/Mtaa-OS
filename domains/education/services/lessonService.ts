
import { supabase } from '@/lib/supabase';
import { Lesson } from '../types/education.types';

export async function getLessons(classId: string, date?: string) {
  let query = supabase
    .from('education_lessons')
    .select('*, subject:education_subjects(*), teacher:education_teachers(*)')
    .eq('class_id', classId);
  if (date) {
    const start = new Date(date).toISOString();
    const end = new Date(date + 'T23:59:59').toISOString();
    query = query.gte('scheduled_at', start).lte('scheduled_at', end);
  }
  const { data, error } = await query.order('scheduled_at');
  if (error) throw error;
  return data as Lesson[];
}

export async function createLesson(lesson: Partial<Lesson>) {
  const { data, error } = await supabase
    .from('education_lessons')
    .insert(lesson)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function startLiveLesson(lessonId: string, meetingLink: string) {
  const { data, error } = await supabase
    .from('education_lessons')
    .update({ status: 'live', meeting_link: meetingLink, started_at: new Date().toISOString() })
    .eq('id', lessonId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endLiveLesson(lessonId: string, recordingUrl?: string) {
  const { data, error } = await supabase
    .from('education_lessons')
    .update({ status: 'completed', recording_url: recordingUrl, ended_at: new Date().toISOString() })
    .eq('id', lessonId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
