import { useIdentity } from './useIdentity';

export function useBusiness() {
  const { business, refresh } = useIdentity();
  return { ...business, refresh };
}
export default useBusiness;
