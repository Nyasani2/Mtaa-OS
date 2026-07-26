import { supabase } from '@/lib/supabase';

export type TribeAction = 'donate' | 'join_paid';

export interface TribeDonateParams {
  action: 'donate';
  tribeId: string;
  donorId: string;
  amount: number;
  currency: string;
  message?: string;
  anonymous?: boolean;
}

export interface TribeJoinPaidParams {
  action: 'join_paid';
  tribeId: string;
  userId: string;
  tier: string;
  amount: number;
  currency: string;
}

export type TribeParams = TribeDonateParams | TribeJoinPaidParams;

export async function tribeOperation(params: TribeParams) {
  const { data, error } = await supabase.functions.invoke('tribe-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const tribeDonate = (p: Omit<TribeDonateParams, 'action'>) => 
  tribeOperation({ action: 'donate', ...p } as TribeDonateParams);

export const tribeJoinPaid = (p: Omit<TribeJoinPaidParams, 'action'>) => 
  tribeOperation({ action: 'join_paid', ...p } as TribeJoinPaidParams);
