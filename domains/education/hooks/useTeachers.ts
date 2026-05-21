
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeachers, registerTeacher, verifyTeacherKyc } from '../services/teacherService';

export function useTeachers(institutionId: string) {
  return useQuery({
    queryKey: ['teachers', institutionId],
    queryFn: () => getTeachers(institutionId),
    enabled: !!institutionId,
  });
}

export function useRegisterTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerTeacher,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['teachers', vars.institution_id] }),
  });
}

export function useVerifyTeacherKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verifiedBy }: { id: string; verifiedBy: string }) => verifyTeacherKyc(id, verifiedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  });
}
