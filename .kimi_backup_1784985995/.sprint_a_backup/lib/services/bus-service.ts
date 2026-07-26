import { supabase } from '@/lib/supabase';

export type BusAction = 'publish' | 'subscribe' | 'ack';

export interface BusPublishParams {
  action: 'publish';
  channel: string;
  event: string;
  payload: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  ttl?: number;
}

export interface BusSubscribeParams {
  action: 'subscribe';
  channel: string;
  subscriberId: string;
  filter?: Record<string, any>;
  maxMessages?: number;
}

export interface BusAckParams {
  action: 'ack';
  channel: string;
  messageId: string;
  subscriberId: string;
}

export type BusParams = BusPublishParams | BusSubscribeParams | BusAckParams;

export async function busOperation(params: BusParams) {
  const { data, error } = await supabase.functions.invoke('bus-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const busPublish = (p: Omit<BusPublishParams, 'action'>) => 
  busOperation({ action: 'publish', ...p } as BusPublishParams);

export const busSubscribe = (p: Omit<BusSubscribeParams, 'action'>) => 
  busOperation({ action: 'subscribe', ...p } as BusSubscribeParams);

export const busAck = (p: Omit<BusAckParams, 'action'>) => 
  busOperation({ action: 'ack', ...p } as BusAckParams);
