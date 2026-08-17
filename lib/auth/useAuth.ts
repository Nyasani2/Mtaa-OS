import { useAuthStore } from './store/auth.store';

export { useAuthStore as useAuth };

export const useIdentity = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    identity: store.user,
    profile: store.user,
  };
};
