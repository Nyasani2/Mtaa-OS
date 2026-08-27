import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useFamily() {
  const { family, refresh } = useAuthStore();
  return { ...family, refresh };
}
export default useFamily;
