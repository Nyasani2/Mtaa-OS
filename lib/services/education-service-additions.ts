// ADD THESE FUNCTIONS TO lib/services/education-service.ts
// Insert after getTeachers() function (around line 286)

export async function getTeacherByUserId(userId: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*, institution:education_institutions(*)')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getStudentByUserId(userId: string) {
  const { data, error } = await supabase
    .from('education_students')
    .select('*, institution:education_institutions(*), class:education_classes(*)')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}
