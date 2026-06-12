
-- ============================================================
-- MTAA EDUCATION — PHASE B1: TEACHER DASHBOARD
-- Run this in Supabase SQL Editor before testing screens
-- ============================================================

-- education_teacher_dashboards: Aggregated teacher metrics
CREATE TABLE IF NOT EXISTS public.education_teacher_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.education_teachers(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  -- My Classes Summary
  total_classes integer DEFAULT 0,
  total_students integer DEFAULT 0,
  active_assignments integer DEFAULT 0,
  pending_grading integer DEFAULT 0,
  upcoming_lessons integer DEFAULT 0,

  -- Today's Schedule
  today_lessons jsonb DEFAULT '[]'::jsonb, -- [{lesson_id, subject, class, time, room, status}]
  today_attendance_marked integer DEFAULT 0,
  today_attendance_total integer DEFAULT 0,

  -- This Week
  week_lessons_count integer DEFAULT 0,
  week_assignments_due integer DEFAULT 0,
  week_tests_scheduled integer DEFAULT 0,
  week_meetings integer DEFAULT 0,

  -- Performance Snapshot
  class_average_score numeric DEFAULT 0,
  top_performers jsonb DEFAULT '[]'::jsonb, -- [{student_id, name, score}]
  struggling_students jsonb DEFAULT '[]'::jsonb, -- [{student_id, name, score, concern}]
  attendance_rate_this_week numeric DEFAULT 0,

  -- Income
  pending_invoices integer DEFAULT 0,
  monthly_income numeric DEFAULT 0,
  total_earned_this_term numeric DEFAULT 0,

  -- Notifications
  unread_messages integer DEFAULT 0,
  pending_parent_requests integer DEFAULT 0,
  system_alerts jsonb DEFAULT '[]'::jsonb,

  -- Quick Actions State
  has_overdue_grading boolean DEFAULT false,
  has_unmarked_attendance boolean DEFAULT false,
  has_pending_approvals boolean DEFAULT false,

  last_refreshed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE (teacher_id)
);

-- education_teacher_activities: Activity feed for teacher
CREATE TABLE IF NOT EXISTS public.education_teacher_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.education_teachers(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.education_institutions(id) ON DELETE CASCADE,

  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY[
    'lesson_completed'::text,
    'assignment_created'::text,
    'assignment_graded'::text,
    'attendance_marked'::text,
    'student_noted'::text,
    'parent_contacted'::text,
    'content_published'::text,
    'test_created'::text,
    'meeting_scheduled'::text,
    'report_submitted'::text,
    'payment_received'::text
  ])),

  title text NOT NULL,
  description text,
  related_id uuid, -- lesson_id, assignment_id, etc.
  related_type text,

  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,

  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edu_teacher_dashboards_teacher ON public.education_teacher_dashboards(teacher_id);
CREATE INDEX IF NOT EXISTS idx_edu_teacher_activities_teacher ON public.education_teacher_activities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_edu_teacher_activities_type ON public.education_teacher_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_edu_teacher_activities_unread ON public.education_teacher_activities(teacher_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.education_teacher_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_teacher_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher dashboards viewable by owner" ON public.education_teacher_dashboards
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));
CREATE POLICY "Teacher dashboards manageable by system" ON public.education_teacher_dashboards
  FOR ALL USING (EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Teacher activities viewable by owner" ON public.education_teacher_activities
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.education_teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid()));
CREATE POLICY "Teacher activities insertable by system" ON public.education_teacher_activities
  FOR INSERT WITH CHECK (true);

-- Trigger
DROP TRIGGER IF EXISTS trg_education_teacher_dashboards_updated_at ON public.education_teacher_dashboards;
CREATE TRIGGER trg_education_teacher_dashboards_updated_at BEFORE UPDATE ON public.education_teacher_dashboards FOR EACH ROW EXECUTE FUNCTION public.update_edu_updated_at();

-- Function: refresh teacher dashboard (call via cron or trigger)
CREATE OR REPLACE FUNCTION public.refresh_teacher_dashboard(p_teacher_id uuid)
RETURNS void AS $$
DECLARE
  v_teacher public.education_teachers%ROWTYPE;
  v_institution_id uuid;
  v_today date := CURRENT_DATE;
  v_week_start date := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer;
BEGIN
  SELECT * INTO v_teacher FROM public.education_teachers WHERE id = p_teacher_id;
  v_institution_id := v_teacher.institution_id;

  INSERT INTO public.education_teacher_dashboards (
    teacher_id, institution_id,
    total_classes, total_students, active_assignments, pending_grading,
    today_lessons, today_attendance_marked, today_attendance_total,
    week_lessons_count, week_assignments_due, week_tests_scheduled,
    last_refreshed_at
  )
  SELECT
    p_teacher_id, v_institution_id,
    (SELECT COUNT(*) FROM public.education_classes WHERE class_teacher_id = p_teacher_id AND is_active = true),
    (SELECT COUNT(*) FROM public.education_students WHERE current_class_id IN (SELECT id FROM public.education_classes WHERE class_teacher_id = p_teacher_id) AND enrollment_status = 'active'),
    (SELECT COUNT(*) FROM public.education_assignments WHERE teacher_id = p_teacher_id AND due_date > now()),
    (SELECT COUNT(*) FROM public.education_submissions s JOIN public.education_assignments a ON s.assignment_id = a.id WHERE a.teacher_id = p_teacher_id AND s.status = 'submitted' AND s.graded_at IS NULL),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('lesson_id', id, 'subject', (SELECT name FROM public.education_subjects WHERE id = subject_id), 'class', (SELECT name FROM public.education_classes WHERE id = class_id), 'time', scheduled_at, 'room', (SELECT room FROM public.education_classes WHERE id = class_id), 'status', status)) FROM public.education_lessons WHERE teacher_id = p_teacher_id AND DATE(scheduled_at) = v_today ORDER BY scheduled_at), '[]'::jsonb),
    (SELECT COUNT(*) FROM public.education_attendance WHERE DATE(date) = v_today AND marked_by = p_teacher_id),
    (SELECT COUNT(*) FROM public.education_students WHERE current_class_id IN (SELECT id FROM public.education_classes WHERE class_teacher_id = p_teacher_id) AND enrollment_status = 'active'),
    (SELECT COUNT(*) FROM public.education_lessons WHERE teacher_id = p_teacher_id AND DATE(scheduled_at) BETWEEN v_week_start AND v_week_start + 6),
    (SELECT COUNT(*) FROM public.education_assignments WHERE teacher_id = p_teacher_id AND DATE(due_date) BETWEEN v_week_start AND v_week_start + 6),
    (SELECT COUNT(*) FROM public.education_assignments WHERE teacher_id = p_teacher_id AND type = 'test' AND DATE(due_date) BETWEEN v_week_start AND v_week_start + 6),
    now()
  ON CONFLICT (teacher_id) DO UPDATE SET
    institution_id = EXCLUDED.institution_id,
    total_classes = EXCLUDED.total_classes,
    total_students = EXCLUDED.total_students,
    active_assignments = EXCLUDED.active_assignments,
    pending_grading = EXCLUDED.pending_grading,
    today_lessons = EXCLUDED.today_lessons,
    today_attendance_marked = EXCLUDED.today_attendance_marked,
    today_attendance_total = EXCLUDED.today_attendance_total,
    week_lessons_count = EXCLUDED.week_lessons_count,
    week_assignments_due = EXCLUDED.week_assignments_due,
    week_tests_scheduled = EXCLUDED.week_tests_scheduled,
    last_refreshed_at = EXCLUDED.last_refreshed_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
