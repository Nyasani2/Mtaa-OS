// hooks/useCivic.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface CivicService {
  id: string;
  name: string;
  category: string;
  description: string;
  department: string;
  required_documents: string[];
  estimated_days: number;
  fee: number;
  currency: string;
  is_online: boolean;
  entry_url?: string;
  status: 'active' | 'maintenance' | 'deprecated';
}

export interface CivicApplication {
  id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  submitted_at?: string;
  completed_at?: string;
  documents: string[];
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CivicState {
  services: CivicService[];
  myApplications: CivicApplication[];
  isLoading: boolean;
  error: string | null;

  loadServices: () => Promise<void>;
  loadMyApplications: () => Promise<void>;
  applyForService: (serviceId: string, documents: string[], notes?: string) => Promise<boolean>;
  getServiceById: (id: string) => CivicService | undefined;
  getApplicationsByStatus: (status: CivicApplication['status']) => CivicApplication[];
  clearError: () => void;
}

const DEFAULT_SERVICES: CivicService[] = [
  {
    id: 'id_card',
    name: 'National ID Card',
    category: 'Identity',
    description: 'Apply for or renew your national identification card',
    department: 'Population Registry',
    required_documents: ['birth_certificate', 'proof_of_residence', 'passport_photo'],
    estimated_days: 14,
    fee: 25,
    currency: 'USD',
    is_online: true,
    entry_url: '/(os)/civic/id-card',
    status: 'active',
  },
  {
    id: 'business_license',
    name: 'Business License',
    category: 'Business',
    description: 'Register and license your business entity',
    department: 'Revenue Authority',
    required_documents: ['business_plan', 'tax_id', 'lease_agreement'],
    estimated_days: 21,
    fee: 150,
    currency: 'USD',
    is_online: true,
    entry_url: '/(os)/civic/business-license',
    status: 'active',
  },
  {
    id: 'property_tax',
    name: 'Property Tax',
    category: 'Tax',
    description: 'Pay your annual property tax assessment',
    department: 'Revenue Authority',
    required_documents: ['property_deed', 'previous_receipt'],
    estimated_days: 1,
    fee: 0,
    currency: 'USD',
    is_online: true,
    entry_url: '/(os)/civic/property-tax',
    status: 'active',
  },
  {
    id: 'building_permit',
    name: 'Building Permit',
    category: 'Permits',
    description: 'Apply for construction and renovation permits',
    department: 'Planning',
    required_documents: ['architectural_plans', 'land_survey', 'environmental_impact'],
    estimated_days: 30,
    fee: 500,
    currency: 'USD',
    is_online: true,
    entry_url: '/(os)/civic/building-permit',
    status: 'active',
  },
  {
    id: 'police_report',
    name: 'Police Clearance',
    category: 'Security',
    description: 'Request police clearance certificate',
    department: 'Police',
    required_documents: ['id_card', 'fingerprints', 'application_form'],
    estimated_days: 7,
    fee: 15,
    currency: 'USD',
    is_online: true,
    entry_url: '/(os)/civic/police-report',
    status: 'active',
  },
];

export const useCivic = create<CivicState>((set, get) => ({
  services: DEFAULT_SERVICES,
  myApplications: [],
  isLoading: false,
  error: null,

  loadServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('civic_services')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      if (data && data.length > 0) {
        set({ services: data as CivicService[] });
      }
    } catch (err) {
      console.warn('Civic: Using default services (DB unavailable)', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMyApplications: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ myApplications: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('civic_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ myApplications: (data || []) as CivicApplication[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  applyForService: async (serviceId: string, documents: string[], notes?: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Please sign in to apply for services' });
      return false;
    }

    const service = get().services.find(s => s.id === serviceId);
    if (!service) {
      set({ error: 'Service not found' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('civic_applications')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          service_name: service.name,
          status: 'submitted',
          documents,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        myApplications: [data as CivicApplication, ...state.myApplications],
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  getServiceById: (id: string) => get().services.find(s => s.id === id),
  getApplicationsByStatus: (status: CivicApplication['status']) =>
    get().myApplications.filter(a => a.status === status),
  clearError: () => set({ error: null }),
}));

export default useCivic;
