import { create } from 'zustand';
import { useAuthStore } from '@/lib/stores/auth-store';

type Module = {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiredRole?: string[];
};

export const useCommandCentre = create((set) => ({
  modules: [] as Module[],

  loadModules: () => {
    const { role, accountType } = useAuthStore.getState();

    const allModules: Module[] = [
      { id: 'civic', name: 'Civic Services', icon: '🏛️', description: 'Government & Projects', requiredRole: ['government', 'admin'] },
      { id: 'health', name: 'Health', icon: '🩺', description: 'Medical services' },
      { id: 'tribes', name: 'Tribes', icon: '🌍', description: 'Culture & Community' },
      { id: 'mtruck', name: 'MTruck', icon: '🚚', description: 'Logistics' },
      { id: 'streets', name: 'Streets', icon: '📢', description: 'Social & Content' },
    ];

    const filtered = allModules.filter(m => 
      !m.requiredRole || m.requiredRole.includes(role || '') || accountType === 'government'
    );

    set({ modules: filtered });
  }
}));
