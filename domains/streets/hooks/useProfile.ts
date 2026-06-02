import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import type { ProfileUpdateInput, ProfileStats } from '../types';

export function useProfile(userId?: string) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['streets', 'profile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });

  const { data: stats } = useQuery({
    queryKey: ['streets', 'profile', 'stats', userId],
    queryFn: () => profileService.getStats(userId),
    enabled: !!userId,
  });

  const updateProfile = useMutation({
    mutationFn: (input: ProfileUpdateInput) => profileService.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'profile'] });
      setIsEditing(false);
    },
  });

  const follow = useMutation({
    mutationFn: (targetId: string) => profileService.followUser(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'profile'] });
    },
  });

  const unfollow = useMutation({
    mutationFn: (targetId: string) => profileService.unfollowUser(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'profile'] });
    },
  });

  return {
    profile,
    stats,
    isLoading,
    isEditing,
    setIsEditing,
    updateProfile,
    follow,
    unfollow,
  };
}
