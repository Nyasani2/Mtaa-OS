import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMovements, createMovement } from '@/services/prisonMovements';
import { PrisonMovement } from '@/types/prisons';

export function useMovements(filters?: Parameters<typeof getMovements>[0]) {
  return useQuery({ queryKey: ['prisonMovements', filters], queryFn: () => getMovements(filters) });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createMovement, onSuccess: () => qc.invalidateQueries({ queryKey: ['prisonMovements'] }) });
}
