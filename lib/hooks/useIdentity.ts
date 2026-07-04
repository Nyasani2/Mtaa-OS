import { useIdentityStore } from '@/lib/identity/store';

export function useIdentity() {
  const store = useIdentityStore();
  return {
    identity: store.identity,
    loading: store.loading,
    verify: store.verify,
  };
}
