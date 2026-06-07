import { useEffect, useState, useCallback } from 'react';
import { AppItem } from '@/types/appstore';

// ── Mock catalog for offline / dev fallback ──
const MOCK_CATALOG: AppItem[] = [
  {
    id: 'mtaxi',
    name: 'MTaxi',
    category: 'Transport',
    description: 'Book rides across Africa. Safe, affordable, and instant.',
    icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.8,
    reviews: 12400,
    size: '24 MB',
    version: '2.1.0',
    developer: 'MTAA Transport',
    route: 'mtaxi',
    installed: false,
  },
  {
    id: 'mtruck',
    name: 'MTruck',
    category: 'Transport',
    description: 'Freight & logistics. Move goods across borders.',
    icon: 'https://cdn-icons-png.flaticon.com/512/3093/3093990.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.6,
    reviews: 8300,
    size: '28 MB',
    version: '1.9.2',
    developer: 'MTAA Logistics',
    route: 'mtruck',
    installed: false,
  },
  {
    id: 'wallet',
    name: 'Wallet',
    category: 'Finance',
    description: 'M-Pesa, banks, crypto, escrow, savings & loans.',
    icon: 'https://cdn-icons-png.flaticon.com/512/3037/3037156.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.9,
    reviews: 25600,
    size: '18 MB',
    version: '3.0.1',
    developer: 'MTAA Finance',
    route: 'wallet',
    installed: true,
  },
  {
    id: 'tribes',
    name: 'Tribes',
    category: 'Social',
    description: 'Community groups, events, and local networking.',
    icon: 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.5,
    reviews: 6700,
    size: '22 MB',
    version: '1.7.0',
    developer: 'MTAA Social',
    route: 'tribes',
    installed: false,
  },
  {
    id: 'shop',
    name: 'Shop',
    category: 'Productivity',
    description: 'Buy & sell goods. Local marketplace.',
    icon: 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.4,
    reviews: 9200,
    size: '20 MB',
    version: '2.0.3',
    developer: 'MTAA Commerce',
    route: 'shop',
    installed: false,
  },
  {
    id: 'health',
    name: 'Health',
    category: 'Health',
    description: 'Telemedicine, records, appointments, insurance.',
    icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.7,
    reviews: 5400,
    size: '26 MB',
    version: '1.5.0',
    developer: 'MTAA Health',
    route: 'health',
    installed: true,
  },
  {
    id: 'education',
    name: 'Education',
    category: 'Education',
    description: 'Courses, certificates, and skills training.',
    icon: 'https://cdn-icons-png.flaticon.com/512/3048/3048386.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.6,
    reviews: 4100,
    size: '30 MB',
    version: '1.3.0',
    developer: 'MTAA Education',
    route: 'education',
    installed: false,
  },
  {
    id: 'civic',
    name: 'Civic',
    category: 'Government',
    description: 'Government services, ID, permits, courts.',
    icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    bannerImage: require('@/assets/images/default-banner.png'), // TODO: Replace with real banner asset
    rating: 4.3,
    reviews: 3200,
    size: '19 MB',
    version: '1.2.0',
    developer: 'MTAA Government',
    route: 'civic',
    installed: false,
  },
];

interface KernelAppStore {
  getCatalog: () => Promise<AppItem[]>;
  getFeatured: () => Promise<AppItem[]>;
  searchApps: (query: string) => Promise<AppItem[]>;
}

interface KernelInstance {
  appStore: KernelAppStore;
  version: string;
  ready: boolean;
}

interface UseOSKernelReturn {
  kernel: KernelInstance | null;
  loading: boolean;
  error: string | null;
}

let kernelInstance: KernelInstance | null = null;

function createKernel(): KernelInstance {
  return {
    version: '1.0.0',
    ready: true,
    appStore: {
      async getCatalog() {
        // In production, this would call Supabase edge function
        // For now, return mock data so UI renders immediately
        return Promise.resolve([...MOCK_CATALOG]);
      },
      async getFeatured() {
        return Promise.resolve(MOCK_CATALOG.slice(0, 3));
      },
      async searchApps(query: string) {
        const q = query.toLowerCase();
        return Promise.resolve(
          MOCK_CATALOG.filter(
            a =>
              a.name.toLowerCase().includes(q) ||
              a.category.toLowerCase().includes(q) ||
              a.description.toLowerCase().includes(q)
          )
        );
      },
    },
  };
}

export function useOSKernel(): UseOSKernelReturn {
  const [kernel, setKernel] = useState<KernelInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const init = async () => {
      try {
        if (!kernelInstance) {
          kernelInstance = createKernel();
        }
        if (mounted) {
          setKernel(kernelInstance);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message ?? 'Kernel init failed');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  return { kernel, loading, error };
}

