// @ts-nocheck
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useProfessional() {
  const { professional, refresh } = useAuthStore();
  return { ...professional, refresh };
}
export default useProfessional;
