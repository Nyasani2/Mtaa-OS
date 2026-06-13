import { supabase } from '@/lib/supabase';

export type MpesaAction = 'stk_push' | 'stk_push_business' | 'callback_handler' | 'daraja_callback' | 'check_status';

export interface MpesaSTKPushParams {
  action: 'stk_push';
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc?: string;
  callbackUrl?: string;
}

export interface MpesaSTKPushBusinessParams {
  action: 'stk_push_business';
  phoneNumber: string;
  amount: number;
  businessShortCode: string;
  accountReference: string;
  transactionType: 'CustomerBuyGoodsOnline' | 'CustomerPayBillOnline';
}

export interface MpesaCallbackParams {
  action: 'callback_handler' | 'daraja_callback';
  payload: Record<string, any>;
}

export interface MpesaCheckStatusParams {
  action: 'check_status';
  checkoutRequestId: string;
}

export type MpesaParams = 
  | MpesaSTKPushParams 
  | MpesaSTKPushBusinessParams 
  | MpesaCallbackParams 
  | MpesaCheckStatusParams;

export async function mpesaOperation(params: MpesaParams) {
  const { data, error } = await supabase.functions.invoke('mpesa-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const stkPush = (p: Omit<MpesaSTKPushParams, 'action'>) => 
  mpesaOperation({ action: 'stk_push', ...p } as MpesaSTKPushParams);

export const stkPushBusiness = (p: Omit<MpesaSTKPushBusinessParams, 'action'>) => 
  mpesaOperation({ action: 'stk_push_business', ...p } as MpesaSTKPushBusinessParams);

export const mpesaCallback = (p: Omit<MpesaCallbackParams, 'action'>) => 
  mpesaOperation({ action: 'callback_handler', ...p } as MpesaCallbackParams);

export const checkMpesaStatus = (p: Omit<MpesaCheckStatusParams, 'action'>) => 
  mpesaOperation({ action: 'check_status', ...p } as MpesaCheckStatusParams);
