import { supabase } from '@/lib/supabase';

export type SchedulerAction = 'schedule' | 'run_now';

export interface SchedulerScheduleParams {
  action: 'schedule';
  taskType: string;
  payload: Record<string, any>;
  scheduleAt: string;
  recurring?: {
    frequency: 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  priority?: 'low' | 'normal' | 'high';
}

export interface SchedulerRunNowParams {
  action: 'run_now';
  taskType: string;
  payload: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

export type SchedulerParams = SchedulerScheduleParams | SchedulerRunNowParams;

export async function schedulerOperation(params: SchedulerParams) {
  const { data, error } = await supabase.functions.invoke('scheduler-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const scheduleTask = (p: Omit<SchedulerScheduleParams, 'action'>) => 
  schedulerOperation({ action: 'schedule', ...p } as SchedulerScheduleParams);

export const runNow = (p: Omit<SchedulerRunNowParams, 'action'>) => 
  schedulerOperation({ action: 'run_now', ...p } as SchedulerRunNowParams);
