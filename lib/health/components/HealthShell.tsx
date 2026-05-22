'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHealthNotifications } from '../hooks/useNotifications';
const navItems = [
  { href: '/health', label: 'Dashboard' },
  { href: '/health/appointments', label: 'Appointments' },
  { href: '/health/providers', label: 'Find Care' },
  { href: '/health/records', label: 'Records' },
  { href: '/health/pharmacy', label: 'Pharmacy' },
  { href: '/health/facilities', label: 'Facilities' },
  { href: '/health/insurance', label: 'Insurance' },
  { href: '/health/telemedicine', label: 'Telemedicine' },
];
export function HealthShell({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: notifications } = useHealthNotifications(userId);
  const unreadCount = notifications?.filter((n: { is_read: boolean }) => !n.is_read).length || 0;
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">MTAA Health</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 lg:px-8 h-16 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2">Menu</button>
          <div className="flex-1 max-w-md mx-4">
            <input type="text" placeholder="Search..." className="w-full pl-4 pr-4 py-2 bg-gray-100 rounded-lg text-sm" />
          </div>
          <Link href="/health/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
            Notifications
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
