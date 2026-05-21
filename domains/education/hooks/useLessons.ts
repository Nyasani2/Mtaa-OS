
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLessons, createLesson, startLiveLesson, endLiveLesson } from '../services/lessonService';

export function useLessons(classId: string, date?: string) {
  return useQuery({
    queryKey: ['lessons', classId, date],
    queryFn: () => getLessons(classId, date),
    enabled: !!classId,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLesson,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['lessons', vars.class_id] }),
  });
}
