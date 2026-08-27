import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useReputation() {
  const { reputation, refresh } = useAuthStore();
  return { ...reputation, refresh };
}
export default useReputation;
