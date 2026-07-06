import { useAuthStore } from '@/lib/auth/store/auth.store';

const ROLE_ROUTE_MAP: Record<string, string[]> = {
  patient: [
    '/health/appointments',
    '/health/insurance',
    '/health/records',
    '/health/vitals',
    '/health/children',
    '/health/emergency',
  ],
  doctor: [
    '/health/doctor',
    '/health/appointments',
    '/health/prescriptions',
    '/health/lab',
    '/health/radiology',
    '/health/records',
    '/health/vitals',
    '/health/emergency',
  ],
  nurse: [
    '/health/vitals',
    '/health/appointments',
    '/health/records',
    '/health/emergency',
    '/health/children',
  ],
  pharmacist: [
    '/health/pharmacy',
    '/health/prescriptions',
    '/health/inventory',
  ],
  cashier: [
    '/health/cashier',
    '/health/invoices',
    '/health/payments',
  ],
  admin: [
    '/health/system',
    '/health/audit',
    '/health/roles',
    '/health/staff',
    '/health/reports',
  ],
  dispatcher: [
    '/health/ambulance',
  ],
};

export function useRoleGuard() {
  const { user } = useAuthStore();
  const role = (user as any)?.health_role ?? 'patient';

  const allowedRoutes = ROLE_ROUTE_MAP[role] ?? ROLE_ROUTE_MAP.patient;

  const canAccess = (route: string): boolean => {
    return allowedRoutes.some((r) => route.startsWith(r)) || role === 'admin';
  };

  return { role, allowedRoutes, canAccess };
}
