import { useIdentity } from './useIdentity';

export function useProfessional() {
  const { professional, refresh } = useIdentity();
  return { ...professional, refresh };
}
export default useProfessional;
