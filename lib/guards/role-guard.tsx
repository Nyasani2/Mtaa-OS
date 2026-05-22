import { useRouter } from 'next/navigation';

export function RoleGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const router = useRouter();
  // Simplified - always render children for now
  return <>{children}</>;
}
