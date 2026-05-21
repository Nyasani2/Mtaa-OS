'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHealthStore } from '../state/health.store';
import { useNotifications } from '../hooks/useNotifications';
import { Activity, Calendar, FileText, Pill, Stethoscope, Building2, Shield, Video, Bell, Search, Home, ChevronRight } from 'lucide-react';

const navItems = [
  { href: '/health', label: 'Dashboard', icon: Home },
  { href: '/health/appointments', label: 'Appointments', icon: Calendar },
  { href: '/health/providers', label: 'Find Care', icon: Stethoscope },
  { href: '/health/records', label: 'Records', icon: FileText },
  { href: '/health/pharmacy', label: 'Pharmacy', icon: Pill },
  { href: '/health/facilities', label: 'Facilities', icon: Building2 },
  { href: '/health/insurance', label: 'Insurance', icon: Shield },
  { href: '/health/telemedicine', label: 'Telemedicine', icon: Video },
];

export function HealthShell({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: notifications } = useNotifications(userId);
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
          <Activity className="w-6 h-6 text-emerald-600" />
          <span className="text-lg font-bold text-gray-900">MTAA Health</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 lg:px-8 h-16 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2"><ChevronRight className="w-5 h-5" /></button>
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search providers, medications, facilities..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <Link href="/health/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
