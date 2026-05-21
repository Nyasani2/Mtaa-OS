
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, broadcastToClass } from '../services/messageService';

export function useEducationMessages(institutionId: string, userId: string) {
  return useQuery({
    queryKey: ['edu-messages', institutionId, userId],
    queryFn: () => getMessages(institutionId, userId),
    enabled: !!institutionId && !!userId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['edu-messages', vars.institution_id] }),
  });
}
