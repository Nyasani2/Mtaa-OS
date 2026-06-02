import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import { osShell } from '@/lib/shell/osShell';

interface Call {
  id: string;
  number: string;
  name?: string;
  status: 'dialing' | 'ringing' | 'connected' | 'ended';
  duration: string;
  startTime: number;
}

interface CallLog {
  id: string;
  number: string;
  name?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
}

interface PhoneState {
  activeCall: Call | null;
  callLogs: CallLog[];
  makeCall: (number: string, name?: string) => void;
  endCall: () => void;
  deleteLog: (id: string) => void;
  addLog: (log: CallLog) => void;
  loadLogs: () => Promise<void>;
}

export const usePhoneStore = create<PhoneState>()(
  persist(
    (set, get) => ({
      activeCall: null,
      callLogs: [],

      makeCall: (number, name) => {
        const call: Call = {
          id: `call_${Date.now()}`,
          number,
          name,
          status: 'dialing',
          duration: '00:00',
          startTime: Date.now(),
        };
        set({ activeCall: call });

        // Simulate call progression
        setTimeout(() => {
          set((s) => ({
            activeCall: s.activeCall ? { ...s.activeCall, status: 'ringing' } : null,
          }));
        }, 1500);

        setTimeout(() => {
          set((s) => ({
            activeCall: s.activeCall ? { ...s.activeCall, status: 'connected' } : null,
          }));
          // Start duration timer
          const timer = setInterval(() => {
            set((s) => {
              if (!s.activeCall) { clearInterval(timer); return s; }
              const elapsed = Math.floor((Date.now() - s.activeCall.startTime) / 1000);
              const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
              const secs = (elapsed % 60).toString().padStart(2, '0');
              return {
                activeCall: { ...s.activeCall, duration: `${mins}:${secs}` },
              };
            });
          }, 1000);
        }, 4000);

        osShell.emit('phone:call:initiated', { number, name });
      },

      endCall: () => {
        const { activeCall, callLogs } = get();
        if (!activeCall) return;

        const log: CallLog = {
          id: `log_${Date.now()}`,
          number: activeCall.number,
          name: activeCall.name,
          type: 'outgoing',
          timestamp: new Date().toLocaleString(),
          duration: activeCall.duration,
        };

        set({
          activeCall: null,
          callLogs: [log, ...callLogs].slice(0, 100),
        });

        osShell.emit('phone:call:ended', { log });
      },

      deleteLog: (id) => {
        set((s) => ({ callLogs: s.callLogs.filter((l) => l.id !== id) }));
      },

      addLog: (log) => {
        set((s) => ({ callLogs: [log, ...s.callLogs].slice(0, 100) }));
      },

      loadLogs: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('call_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);
        if (data) {
          set({ callLogs: data.map((d: any) => ({
            id: d.id,
            number: d.number,
            name: d.name,
            type: d.type,
            timestamp: new Date(d.created_at).toLocaleString(),
            duration: d.duration,
          })) });
        }
      },
    }),
    { name: 'mtaa-phone-store' }
  )
);
