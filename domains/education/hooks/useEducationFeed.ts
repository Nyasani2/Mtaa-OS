
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeed, createFeedPost, likeFeedPost } from '../services/feedService';

export function useEducationFeed(institutionId: string, isJunior?: boolean) {
  return useQuery({
    queryKey: ['edu-feed', institutionId, isJunior],
    queryFn: () => getFeed(institutionId, isJunior),
    enabled: !!institutionId,
  });
}

export function useCreateFeedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFeedPost,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['edu-feed', vars.institution_id] }),
  });
}
