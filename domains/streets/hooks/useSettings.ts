import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';
import type { PrivacySettings, NotificationSettings, ContentSettings } from '../types';

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: privacy } = useQuery({
    queryKey: ['streets', 'settings', 'privacy'],
    queryFn: () => settingsService.getPrivacySettings(),
  });

  const { data: notifications } = useQuery({
    queryKey: ['streets', 'settings', 'notifications'],
    queryFn: () => settingsService.getNotificationSettings(),
  });

  const { data: content } = useQuery({
    queryKey: ['streets', 'settings', 'content'],
    queryFn: () => settingsService.getContentSettings(),
  });

  const updatePrivacy = useMutation({
    mutationFn: (settings: Partial<PrivacySettings>) =>
      settingsService.updatePrivacySettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'settings', 'privacy'] });
    },
  });

  const updateNotifications = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      settingsService.updateNotificationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'settings', 'notifications'] });
    },
  });

  const updateContent = useMutation({
    mutationFn: (settings: Partial<ContentSettings>) =>
      settingsService.updateContentSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'settings', 'content'] });
    },
  });

  const blockUser = useMutation({
    mutationFn: (userId: string) => settingsService.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'settings'] });
    },
  });

  const unblockUser = useMutation({
    mutationFn: (userId: string) => settingsService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'settings'] });
    },
  });

  return {
    privacy,
    notifications,
    content,
    updatePrivacy,
    updateNotifications,
    updateContent,
    blockUser,
    unblockUser,
  };
}
