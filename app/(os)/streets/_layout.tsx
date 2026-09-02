// @ts-nocheck
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StreetsLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const isProtected = segments.some(s => s === 'create' || s === 'post');
    if (isProtected && !user) { router.replace('/(os)/auth/login'); }
  }, [user, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' }, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Streets' }}/>
      <Stack.Screen name="create" options={{ title: 'New Post', presentation: 'modal' }}/>
      <Stack.Screen name="post/[postId]" options={{ title: 'Post' }}/>
      <Stack.Screen name="creator/[creatorId]" options={{ title: 'Creator' }}/>
      <Stack.Screen name="hashtag/[tag]" options={{ title: 'Hashtag' }}/>
    </Stack>
  );
}
