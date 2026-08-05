// ADD THESE FUNCTIONS TO lib/services/education-service.ts
// Insert after getTeachers() function (around line 286)
// FIXED: Implicit joins replaced with explicit two-query pattern

export async function getTeacherByUserId(userId: string) {
  const { data: teacher, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  // Fetch institution separately
  let institution = null;
  if (teacher?.institution_id) {
    const { data: inst } = await supabase
      .from('education_institutions')
      .select('*')
      .eq('id', teacher.institution_id)
      .maybeSingle();
    institution = inst;
  }

  return { ...teacher, institution };
}

export async function getStudentByUserId(userId: string) {
  const { data: student, error } = await supabase
    .from('education_students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  // Fetch institution and class separately
  let institution = null;
  let classData = null;
  if (student?.institution_id) {
    const { data: inst } = await supabase
      .from('education_institutions')
      .select('*')
      .eq('id', student.institution_id)
      .maybeSingle();
    institution = inst;
  }
  if (student?.class_id) {
    const { data: cls } = await supabase
      .from('education_classes')
      .select('*')
      .eq('id', student.class_id)
      .maybeSingle();
    classData = cls;
  }

  return { ...student, institution, class: classData };
}
