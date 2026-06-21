import { useIdentity } from './useIdentity';

export function useQR() {
  const { qr, identity, refresh } = useIdentity();
  return { ...qr, userName: identity.full_name || identity.username, refresh };
}
export default useQR;
