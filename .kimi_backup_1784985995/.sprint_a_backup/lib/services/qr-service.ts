import { supabase } from '@/lib/supabase';

export type QRAction = 'generate' | 'resolve' | 'execute';

export interface QRGenerateParams {
  action: 'generate';
  type: 'payment' | 'transfer' | 'login' | 'app_install' | 'education' | 'agent';
  payload: Record<string, any>;
  expiresIn?: number; // seconds
  size?: number;
}

export interface QRResolveParams {
  action: 'resolve';
  code: string;
}

export interface QRExecuteParams {
  action: 'execute';
  code: string;
  userId: string;
  confirmation?: Record<string, any>;
}

export type QRParams = QRGenerateParams | QRResolveParams | QRExecuteParams;

export async function qrOperation(params: QRParams) {
  const { data, error } = await supabase.functions.invoke('qr-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const generateQR = (p: Omit<QRGenerateParams, 'action'>) => 
  qrOperation({ action: 'generate', ...p } as QRGenerateParams);

export const resolveQR = (p: Omit<QRResolveParams, 'action'>) => 
  qrOperation({ action: 'resolve', ...p } as QRResolveParams);

export const executeQR = (p: Omit<QRExecuteParams, 'action'>) => 
  qrOperation({ action: 'execute', ...p } as QRExecuteParams);
