import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useQR() {
  const { qr, identity, refresh } = useAuthStore();
  return { ...qr, userName: identity.full_name || identity.username, refresh };
}
export default useQR;
