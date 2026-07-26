
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudents, enrollStudent, updateStudentClass } from '../services/studentService';

export function useStudents(institutionId: string, classId?: string) {
  return useQuery({
    queryKey: ['students', institutionId, classId],
    queryFn: () => getStudents(institutionId, classId),
    enabled: !!institutionId,
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enrollStudent,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['students', vars.institution_id] }),
  });
}
