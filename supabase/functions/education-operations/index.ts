
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const body = await req.json();
    const { operation, payload } = body;

    let result;

    switch (operation) {
      // SCHOOL ADMIN OPERATIONS
      case 'create_school': {
        const { data, error } = await supabase
          .from('education_institutions')
          .insert({ ...payload, principal_id: user.id })
          .select()
          .single();
        if (error) throw error;
        // Auto-create principal as school admin
        await supabase.from('education_school_admins').insert({
          user_id: user.id,
          institution_id: data.id,
          role: 'principal',
          permissions: ['all']
        });
        result = data;
        break;
      }

      case 'add_teacher': {
        const { data, error } = await supabase
          .from('education_teachers')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'add_student': {
        const { data, error } = await supabase
          .from('education_students')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'connect_parent': {
        const { data, error } = await supabase
          .from('education_parent_connections')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'create_class': {
        const { data, error } = await supabase
          .from('education_classes')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'assign_subject': {
        const { data, error } = await supabase
          .from('education_class_subjects')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // TEACHER OPERATIONS
      case 'create_assignment': {
        const { data, error } = await supabase
          .from('education_assignments')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'grade_submission': {
        const { data, error } = await supabase
          .from('education_submissions')
          .update({
            score: payload.score,
            feedback: payload.feedback,
            status: 'graded',
            graded_by: payload.teacher_id,
            graded_at: new Date().toISOString()
          })
          .eq('id', payload.submission_id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'mark_attendance': {
        const { data, error } = await supabase
          .from('education_attendance')
          .upsert(payload, { onConflict: 'student_id,date,class_id' })
          .select();
        if (error) throw error;
        result = data;
        break;
      }

      case 'send_message': {
        const { data, error } = await supabase
          .from('education_messages')
          .insert({ ...payload, sender_id: user.id })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      // STUDENT OPERATIONS
      case 'submit_assignment': {
        const { data, error } = await supabase
          .from('education_submissions')
          .insert({ ...payload, submitted_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      case 'get_student_dashboard': {
        const studentId = payload.student_id;
        const [classes, assignments, grades, attendance, timetable] = await Promise.all([
          supabase.from('education_classes').select('*').eq('id', payload.class_id).single(),
          supabase.from('education_assignments').select('*, education_class_subjects(class_id)').eq('education_class_subjects.class_id', payload.class_id),
          supabase.from('education_grades').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(10),
          supabase.from('education_attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30),
          supabase.from('education_timetable').select('*, education_class_subjects(subjects(name))').eq('class_id', payload.class_id)
        ]);
        result = { classes, assignments, grades, attendance, timetable };
        break;
      }

      // PARENT OPERATIONS
      case 'get_parent_dashboard': {
        const { data: connections } = await supabase
          .from('education_parent_connections')
          .select('*, education_students(*)')
          .eq('parent_id', user.id);
        result = connections;
        break;
      }

      case 'pay_fees': {
        // Create wallet transaction request
        const { data, error } = await supabase
          .from('education_fee_payments')
          .insert({ ...payload, payer_id: user.id, status: 'pending' })
          .select()
          .single();
        if (error) throw error;
        result = data;
        break;
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
